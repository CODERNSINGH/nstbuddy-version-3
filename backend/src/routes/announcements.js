import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin } from '../middleware/auth.js';
import { IMAGEKIT_URL_ENDPOINT } from '../config/imagekit.js';

const router = express.Router();
const prisma = new PrismaClient();

// Only accept an image URL that actually came from our ImageKit account
const sanitizeImageUrl = (url) => (typeof url === 'string' && url.startsWith(IMAGEKIT_URL_ENDPOINT) ? url : null);

// Only accept well-formed http(s) links
const sanitizeLink = (url) => {
    if (typeof url !== 'string' || !url.trim()) return null;
    try {
        const parsed = new URL(url.trim());
        return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : null;
    } catch {
        return null;
    }
};

// Returns undefined (field omitted) for invalid input so callers can 400 on it
const parseDeadline = (value) => {
    if (value === null || value === '') return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
};

// GET /api/announcements - active announcements for the main page rail
router.get('/', async (req, res) => {
    try {
        const announcements = await prisma.announcement.findMany({
            where: { isActive: true },
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        });

        res.json({ success: true, announcements });
    } catch (error) {
        console.error('Get announcements error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch announcements' });
    }
});

// GET /api/announcements/all - full roster, admin only
router.get('/all', authenticateAdmin, async (req, res) => {
    try {
        const announcements = await prisma.announcement.findMany({
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        });

        res.json({ success: true, announcements });
    } catch (error) {
        console.error('Get all announcements error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch announcements' });
    }
});

// POST /api/announcements - create (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
    try {
        const title = (req.body.title || '').trim();
        const description = (req.body.description || '').trim();
        const imageUrl = sanitizeImageUrl(req.body.imageUrl);
        const link = sanitizeLink(req.body.link);
        const order = Number.isFinite(Number(req.body.order)) ? Number(req.body.order) : 0;

        if (!title) return res.status(400).json({ success: false, error: 'Title is required' });
        if (title.length > 100) return res.status(400).json({ success: false, error: 'Title is too long (max 100 characters)' });
        if (!description) return res.status(400).json({ success: false, error: 'Description is required' });
        if (description.length > 500) return res.status(400).json({ success: false, error: 'Description is too long (max 500 characters)' });

        let deadline = null;
        if (req.body.deadline) {
            deadline = parseDeadline(req.body.deadline);
            if (deadline === undefined) return res.status(400).json({ success: false, error: 'Invalid deadline' });
        }

        const announcement = await prisma.announcement.create({
            data: { title, description, imageUrl, link, deadline, order, createdBy: req.user.email },
        });

        res.status(201).json({ success: true, announcement });
    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({ success: false, error: 'Failed to create announcement' });
    }
});

// PUT /api/announcements/:id - update (admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const data = {};

        if (req.body.title !== undefined) {
            const title = req.body.title.trim();
            if (!title) return res.status(400).json({ success: false, error: 'Title is required' });
            if (title.length > 100) return res.status(400).json({ success: false, error: 'Title is too long (max 100 characters)' });
            data.title = title;
        }
        if (req.body.description !== undefined) {
            const description = req.body.description.trim();
            if (!description) return res.status(400).json({ success: false, error: 'Description is required' });
            if (description.length > 500) return res.status(400).json({ success: false, error: 'Description is too long (max 500 characters)' });
            data.description = description;
        }
        if (req.body.imageUrl !== undefined) {
            data.imageUrl = sanitizeImageUrl(req.body.imageUrl);
        }
        if (req.body.link !== undefined) {
            data.link = sanitizeLink(req.body.link);
        }
        if (req.body.deadline !== undefined) {
            const deadline = parseDeadline(req.body.deadline);
            if (deadline === undefined) return res.status(400).json({ success: false, error: 'Invalid deadline' });
            data.deadline = deadline;
        }
        if (req.body.isActive !== undefined) data.isActive = !!req.body.isActive;
        if (req.body.order !== undefined) data.order = Number(req.body.order) || 0;

        const announcement = await prisma.announcement.update({ where: { id }, data });

        res.json({ success: true, announcement });
    } catch (error) {
        console.error('Update announcement error:', error);
        res.status(500).json({ success: false, error: 'Failed to update announcement' });
    }
});

// DELETE /api/announcements/:id - remove (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        await prisma.announcement.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete announcement' });
    }
});

export default router;
