import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/campuses - List all active campuses
router.get('/', async (req, res) => {
    try {
        const campuses = await prisma.campus.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                imageUrl: true,
                _count: {
                    select: { questions: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.json({
            success: true,
            campuses: campuses.map(campus => ({
                ...campus,
                questionCount: campus._count.questions
            }))
        });
    } catch (error) {
        console.error('Error fetching campuses:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch campuses'
        });
    }
});

// GET /api/campuses/:slug - Get campus details
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const campus = await prisma.campus.findUnique({
            where: { slug },
            include: {
                _count: {
                    select: { questions: true }
                }
            }
        });

        if (!campus) {
            return res.status(404).json({
                success: false,
                error: 'Campus not found'
            });
        }

        res.json({
            success: true,
            campus: {
                ...campus,
                questionCount: campus._count.questions
            }
        });
    } catch (error) {
        console.error('Error fetching campus:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch campus'
        });
    }
});

// GET /api/campuses/:slug/semesters - Get semester stats for campus
router.get('/:slug/semesters', async (req, res) => {
    try {
        const { slug } = req.params;

        const campus = await prisma.campus.findUnique({
            where: { slug }
        });

        if (!campus) {
            return res.status(404).json({
                success: false,
                error: 'Campus not found'
            });
        }

        // Get question count for each semester (1-8)
        const semesterStats = await Promise.all(
            Array.from({ length: 8 }, async (_, i) => {
                const semester = i + 1;
                const count = await prisma.question.count({
                    where: {
                        campusId: campus.id,
                        semester,
                        isApproved: true
                    }
                });

                return {
                    semester,
                    questionCount: count
                };
            })
        );

        res.json({
            success: true,
            campus: {
                id: campus.id,
                name: campus.name,
                slug: campus.slug
            },
            semesters: semesterStats
        });
    } catch (error) {
        console.error('Error fetching semester stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch semester stats'
        });
    }
});

export default router;
