import express from 'express';
import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../middleware/auth.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
// Priority: Environment variables > Service account JSON file
if (!admin.apps.length) {
    let firebaseConfig;

    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        // Use environment variables (for production deployment)
        console.log('🔥 Initializing Firebase Admin SDK with environment variables');
        firebaseConfig = {
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            })
        };
    } else {
        // Fall back to service account JSON file (for local development)
        console.log('🔥 Initializing Firebase Admin SDK with service account file');
        const serviceAccountPath = join(__dirname, '../../firebase-service-account.json');

        if (!fs.existsSync(serviceAccountPath)) {
            throw new Error('❌ Firebase service account file not found and environment variables not set!');
        }

        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        firebaseConfig = {
            credential: admin.credential.cert(serviceAccount)
        };
    }

    admin.initializeApp(firebaseConfig);
    console.log('✅ Firebase Admin SDK initialized successfully');
}

const router = express.Router();
const prisma = new PrismaClient();

// Verify Firebase ID token and get/create user
router.post('/verify-token', async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ success: false, error: 'ID token is required' });
        }

        console.log('\n🔐 ═══════════════════════════════════════════');
        console.log('🔐 VERIFYING FIREBASE TOKEN');
        console.log('🔐 ═══════════════════════════════════════════');

        // Verify the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        console.log('📋 Firebase Token Data:');
        console.log(`   ├─ Firebase UID: ${decodedToken.uid}`);
        console.log(`   ├─ Email: ${decodedToken.email}`);
        console.log(`   ├─ Name: ${decodedToken.name || 'N/A'}`);
        console.log(`   └─ Picture: ${decodedToken.picture ? 'Yes' : 'No'}`);

        console.log('\n🔍 Checking if user exists in database...');

        // Check if user exists in database
        let user = await prisma.user.findUnique({
            where: { firebaseUid: decodedToken.uid }
        });

        if (!user) {
            // Create new user
            console.log('👤 User not found, creating new user...');
            user = await prisma.user.create({
                data: {
                    firebaseUid: decodedToken.uid,
                    email: decodedToken.email,
                    name: decodedToken.name || decodedToken.email.split('@')[0],
                    picture: decodedToken.picture || null,
                }
            });
            console.log('✅ New user created successfully!');
            console.log(`   ├─ User ID: ${user.id}`);
            console.log(`   ├─ Email: ${user.email}`);
            console.log(`   ├─ isPro: ${user.isPro}`);
            console.log(`   └─ isAdmin: ${user.isAdmin}`);
        } else {
            // Update last login time
            console.log('✅ User found! Updating last login time...');
            console.log(`   ├─ User ID: ${user.id}`);
            console.log(`   ├─ Email: ${user.email}`);
            console.log(`   ├─ isPro: ${user.isPro}`);
            console.log(`   └─ isAdmin: ${user.isAdmin}`);

            user = await prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() }
            });
            console.log('✅ Last login time updated successfully');
        }

        console.log('\n✅ Firebase authentication successful!');
        console.log('🔐 ═══════════════════════════════════════════\n');

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                picture: user.picture,
                isPro: user.isPro,
                isAdmin: user.isAdmin,
                disclaimerAcknowledgedAt: user.disclaimerAcknowledgedAt
            }
        });
    } catch (error) {
        console.error('❌ Firebase token verification error:', error);
        console.log('🔐 ═══════════════════════════════════════════\n');
        res.status(401).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
});

// Logout endpoint
router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

// Record that the current user clicked "I Understand" on the academic-integrity disclaimer
router.post('/acknowledge-disclaimer', authenticateUser, async (req, res) => {
    try {
        const user = await prisma.user.update({
            where: { email: req.user.email },
            data: { disclaimerAcknowledgedAt: new Date() }
        });

        res.json({
            success: true,
            disclaimerAcknowledgedAt: user.disclaimerAcknowledgedAt
        });
    } catch (error) {
        console.error('Acknowledge disclaimer error:', error);
        res.status(500).json({ success: false, error: 'Failed to record acknowledgement' });
    }
});

// Get all admins (for contributors list)
router.get('/admins', async (req, res) => {
    try {
        const admins = await prisma.user.findMany({
            where: { isAdmin: true },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(admins);
    } catch (error) {
        console.error('Get admins error:', error);
        res.status(500).json({ error: 'Failed to fetch admins' });
    }
});

// Setup admin (create admin user with unique key)
router.post('/setup-admin', async (req, res) => {
    try {
        const { email, uniqueKey, name } = req.body;

        if (!email || !uniqueKey || !name) {
            return res.status(400).json({ error: 'Email, unique key, and name are required' });
        }

        // Verify unique key (you should change this to a secure key)
        if (uniqueKey !== process.env.ADMIN_SECRET_KEY) {
            return res.status(403).json({ error: 'Invalid unique key' });
        }

        // Check if user already exists
        let user = await prisma.user.findUnique({
            where: { email }
        });

        if (user) {
            // Update existing user to admin
            user = await prisma.user.update({
                where: { email },
                data: { isAdmin: true, name }
            });
        } else {
            // Create new admin user
            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    firebaseUid: `admin-${Date.now()}`, // Temporary UID for admin
                    isAdmin: true
                }
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('Setup admin error:', error);
        res.status(500).json({ error: 'Failed to setup admin' });
    }
});

export default router;
