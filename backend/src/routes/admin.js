import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin } from '../middleware/auth.js';
import { IMAGEKIT_URL_ENDPOINT } from '../config/imagekit.js';

const router = express.Router();
const prisma = new PrismaClient();

// Only accept an image URL that actually came from our ImageKit account
const sanitizeImageUrl = (url) => (typeof url === 'string' && url.startsWith(IMAGEKIT_URL_ENDPOINT) ? url : null);

// GET /api/admin/users - full user roster for the admin panel
router.get('/users', authenticateAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                name: true,
                picture: true,
                isAdmin: true,
                isPro: true,
                isBanned: true,
                contributionCount: true,
                contributionPoints: true,
                createdAt: true,
                lastLoginAt: true,
                _count: { select: { posts: true, comments: true } },
            },
        });

        res.json({
            success: true,
            users: users.map((u) => ({
                id: u.id,
                email: u.email,
                name: u.name,
                picture: u.picture,
                isAdmin: u.isAdmin,
                isPro: u.isPro,
                isBanned: u.isBanned,
                contributionCount: u.contributionCount,
                contributionPoints: u.contributionPoints,
                postCount: u._count.posts,
                commentCount: u._count.comments,
                createdAt: u.createdAt,
                lastLoginAt: u.lastLoginAt,
            })),
        });
    } catch (error) {
        console.error('Admin get users error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
});

// PUT /api/admin/users/:email/ban - block/unblock a user from posting in Community
router.put('/users/:email/ban', authenticateAdmin, async (req, res) => {
    try {
        const targetEmail = decodeURIComponent(req.params.email);
        const banned = Boolean(req.body.banned);

        if (targetEmail === req.user.email) {
            return res.status(400).json({ success: false, error: "You can't ban your own account" });
        }

        const target = await prisma.user.findUnique({ where: { email: targetEmail } });
        if (!target) return res.status(404).json({ success: false, error: 'User not found' });

        const updated = await prisma.user.update({
            where: { email: targetEmail },
            data: { isBanned: banned },
        });

        res.json({ success: true, isBanned: updated.isBanned });
    } catch (error) {
        console.error('Admin ban user error:', error);
        res.status(500).json({ success: false, error: 'Failed to update user' });
    }
});

// GET /api/admin/custom-courses - full course roster (incl. courses with 0 questions yet)
router.get('/custom-courses', authenticateAdmin, async (req, res) => {
    try {
        const courses = await prisma.customCourse.findMany({
            orderBy: { name: 'asc' },
        });

        const counts = await prisma.question.groupBy({
            by: ['customCourse'],
            where: { customCourse: { not: null } },
            _count: { customCourse: true },
        });
        const countMap = Object.fromEntries(counts.map((c) => [c.customCourse, c._count.customCourse]));

        res.json({
            success: true,
            courses: courses.map((c) => ({
                id: c.id,
                name: c.name,
                description: c.description,
                imageUrl: c.imageUrl,
                questionCount: countMap[c.name] || 0,
                createdAt: c.createdAt,
            })),
        });
    } catch (error) {
        console.error('Admin get custom courses error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch courses' });
    }
});

// POST /api/admin/custom-courses - add a new course students can select when contributing
router.post('/custom-courses', authenticateAdmin, async (req, res) => {
    try {
        const name = (req.body.name || '').trim();
        const description = (req.body.description || '').trim();
        const imageUrl = sanitizeImageUrl(req.body.imageUrl);

        if (!name) return res.status(400).json({ success: false, error: 'Course name is required' });
        if (name.length > 80) return res.status(400).json({ success: false, error: 'Course name is too long (max 80 characters)' });
        if (description.length > 500) return res.status(400).json({ success: false, error: 'Description is too long (max 500 characters)' });

        const course = await prisma.customCourse.create({
            data: { name, description: description || null, imageUrl, createdBy: req.user.email },
        });

        res.status(201).json({ success: true, course });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, error: 'A course with this name already exists' });
        }
        console.error('Admin create custom course error:', error);
        res.status(500).json({ success: false, error: 'Failed to create course' });
    }
});

// DELETE /api/admin/custom-courses/:id - remove a course from the picker (existing questions keep their tag)
router.delete('/custom-courses/:id', authenticateAdmin, async (req, res) => {
    try {
        await prisma.customCourse.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Admin delete custom course error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete course' });
    }
});

export default router;
