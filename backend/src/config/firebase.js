import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
const serviceAccountPath = join(__dirname, '../../firebase-service-account.json');

try {
    let credential;

    // Try to use service account file first (for local development)
    if (fs.existsSync(serviceAccountPath)) {
        console.log('📁 Using Firebase service account file');
        credential = admin.credential.cert(serviceAccountPath);
    }
    // Fall back to environment variables (for production/Render)
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        console.log('🔐 Using Firebase environment variables');
        credential = admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        });
    } else {
        throw new Error('Firebase credentials not found. Please provide either firebase-service-account.json or environment variables.');
    }

    admin.initializeApp({ credential });
    console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error);
    process.exit(1);
}

export const auth = admin.auth();
export default admin;
