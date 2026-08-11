import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all active notices
router.get('/', async (req, res) => {
    try {
        const notices = await prisma.notice.findMany({
            where: {
                isActive: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gte: new Date() } }
                ]
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        res.json(notices);
    } catch (error) {
        console.error('Get notices error:', error);
        res.status(500).json({ error: 'Failed to fetch notices' });
    }
});

// Get all notices (admin only)
router.get('/all', authenticateAdmin, async (req, res) => {
    try {
        const notices = await prisma.notice.findMany({
            orderBy: { createdAt: 'desc' }
        });

        res.json(notices);
    } catch (error) {
        console.error('Get all notices error:', error);
        res.status(500).json({ error: 'Failed to fetch notices' });
    }
});

// Create new notice (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
    try {
        const { title, content, priority, expiresAt } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const notice = await prisma.notice.create({
            data: {
                title,
                content,
                priority: priority || 'normal',
                expiresAt: expiresAt ? new Date(expiresAt) : null
            }
        });

        res.status(201).json(notice);
    } catch (error) {
        console.error('Create notice error:', error);
        res.status(500).json({ error: 'Failed to create notice' });
    }
});

// Update notice (admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, priority, isActive, expiresAt } = req.body;

        const notice = await prisma.notice.update({
            where: { id },
            data: {
                title,
                content,
                priority,
                isActive,
                expiresAt: expiresAt ? new Date(expiresAt) : null
            }
        });

        res.json(notice);
    } catch (error) {
        console.error('Update notice error:', error);
        res.status(500).json({ error: 'Failed to update notice' });
    }
});

// Delete notice (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.notice.delete({
            where: { id }
        });

        res.json({ success: true, message: 'Notice deleted successfully' });
    } catch (error) {
        console.error('Delete notice error:', error);
        res.status(500).json({ error: 'Failed to delete notice' });
    }
});

export default router;
