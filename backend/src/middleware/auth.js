import { auth } from '../config/firebase.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Middleware to verify Firebase ID token
export const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const idToken = authHeader.split('Bearer ')[1];

        // Verify the ID token
        const decodedToken = await auth.verifyIdToken(idToken);

        // Get user from database or create if doesn't exist
        let user = await prisma.user.findUnique({
            where: { firebaseUid: decodedToken.uid }
        });

        if (!user) {
            // Auto-create user if they don't exist
            console.log('👤 User not found in database, creating new user...');
            user = await prisma.user.create({
                data: {
                    firebaseUid: decodedToken.uid,
                    email: decodedToken.email,
                    name: decodedToken.name || decodedToken.email.split('@')[0],
                    picture: decodedToken.picture || null,
                }
            });
            console.log('✅ New user created successfully:', user.email);
        }

        req.user = {
            ...decodedToken,
            email: user.email,
            isAdmin: user.isAdmin,
            userId: user.id
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Middleware to verify admin status
export const authenticateAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const idToken = authHeader.split('Bearer ')[1];

        // Verify the ID token
        const decodedToken = await auth.verifyIdToken(idToken);

        // Check if user is admin in database
        let user = await prisma.user.findUnique({
            where: { firebaseUid: decodedToken.uid }
        });

        if (!user) {
            // Auto-create user if they don't exist
            console.log('👤 Admin user not found in database, creating new user...');
            user = await prisma.user.create({
                data: {
                    firebaseUid: decodedToken.uid,
                    email: decodedToken.email,
                    name: decodedToken.name || decodedToken.email.split('@')[0],
                    picture: decodedToken.picture || null,
                }
            });
            console.log('✅ New user created:', user.email);
        }

        if (!user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        req.user = {
            ...decodedToken,
            email: user.email,
            isAdmin: user.isAdmin
        };

        next();
    } catch (error) {
        console.error('Admin authentication error:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
