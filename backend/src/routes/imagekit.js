import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { imagekit, IMAGEKIT_URL_ENDPOINT } from '../config/imagekit.js';

const router = express.Router();

// GET /api/imagekit/auth - short-lived signature so the client can upload
// directly to ImageKit without this server ever touching the file bytes.
router.get('/auth', authenticateUser, (req, res) => {
    try {
        const authParams = imagekit.getAuthenticationParameters();
        res.json({
            success: true,
            ...authParams,
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
            urlEndpoint: IMAGEKIT_URL_ENDPOINT,
        });
    } catch (error) {
        console.error('ImageKit auth error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate upload authorization' });
    }
});

export default router;
