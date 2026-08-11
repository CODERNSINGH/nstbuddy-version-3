import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all courses
router.get('/', async (req, res) => {
    try {
        const { includeInactive } = req.query;

        const where = includeInactive === 'true' ? {} : { isActive: true };

        const courses = await prisma.course.findMany({
            where,
            include: {
                _count: {
                    select: { questions: true }
                }
            },
            orderBy: [
                { year: 'desc' },
                { name: 'asc' }
            ]
        });

        res.json(courses);
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});

// Get single course
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                questions: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json(course);
    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({ error: 'Failed to fetch course' });
    }
});

// Create new course (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
    try {
        const { name, description, year } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Course name is required' });
        }

        const course = await prisma.course.create({
            data: {
                name,
                description,
                year: year ? parseInt(year) : null
            }
        });

        res.status(201).json(course);
    } catch (error) {
        console.error('Create course error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Course with this name already exists' });
        }
        res.status(500).json({ error: 'Failed to create course' });
    }
});

// Update course (admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, year, isActive } = req.body;

        const course = await prisma.course.update({
            where: { id },
            data: {
                name,
                description,
                year: year ? parseInt(year) : null,
                isActive
            }
        });

        res.json(course);
    } catch (error) {
        console.error('Update course error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Course with this name already exists' });
        }
        res.status(500).json({ error: 'Failed to update course' });
    }
});

// Delete course (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if course has questions
        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { questions: true }
                }
            }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        if (course._count.questions > 0) {
            return res.status(400).json({
                error: 'Cannot delete course with associated questions. Please remove or reassign questions first.'
            });
        }

        await prisma.course.delete({
            where: { id }
        });

        res.json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ error: 'Failed to delete course' });
    }
});

export default router;
