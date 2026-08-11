import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, authenticateUser } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/questions - Get all questions with filtering
router.get('/', async (req, res) => {
    try {
        const { semester, subject, topic, search, campus, limit } = req.query;

        const where = {
            isApproved: true // Only show approved questions
        };

        if (campus) {
            // Find campus by slug
            const campusRecord = await prisma.campus.findUnique({
                where: { slug: campus }
            });
            if (campusRecord) {
                where.campusId = campusRecord.id;
            }
        }

        if (semester) {
            where.semester = parseInt(semester);
        }

        if (subject) {
            where.subject = subject;
        }

        if (topic) {
            where.topic = topic;
        }

        if (search) {
            where.OR = [
                { questionName: { contains: search, mode: 'insensitive' } },
                { topic: { contains: search, mode: 'insensitive' } },
                { subject: { contains: search, mode: 'insensitive' } }
            ];
        }

        const questions = await prisma.question.findMany({
            where,
            include: {
                campus: {
                    select: {
                        name: true,
                        slug: true
                    }
                },
                contributor: {
                    select: {
                        name: true,
                        email: true,
                        picture: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            ...(limit ? { take: parseInt(limit) } : {})
        });

        res.json({
            success: true,
            questions
        });
    } catch (error) {
        console.error('Get questions error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch questions'
        });
    }
});

// GET /api/questions/filters - Get unique subjects and topics for filtering
router.get('/filters', async (req, res) => {
    try {
        const { semester, campus } = req.query;

        const where = { isApproved: true };

        if (campus) {
            const campusRecord = await prisma.campus.findUnique({
                where: { slug: campus }
            });
            if (campusRecord) {
                where.campusId = campusRecord.id;
            }
        }

        if (semester) {
            where.semester = parseInt(semester);
        }

        const questions = await prisma.question.findMany({
            where,
            select: {
                subject: true,
                topic: true
            }
        });

        const subjects = [...new Set(questions.map(q => q.subject))].sort();
        const topics = [...new Set(questions.map(q => q.topic))].sort();

        res.json({
            success: true,
            subjects,
            topics
        });
    } catch (error) {
        console.error('Get filters error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch filters'
        });
    }
});

// GET /api/questions/solution - Find solution link by question name
router.get('/solution', async (req, res) => {
    try {
        const { questionName } = req.query;

        if (!questionName || typeof questionName !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'questionName query parameter is required'
            });
        }

        const question = await prisma.question.findFirst({
            where: {
                isApproved: true,
                questionName: {
                    contains: questionName.trim(),
                    mode: 'insensitive'
                }
            },
            orderBy: { createdAt: 'desc' },
            select: {
                link: true,
                questionName: true,
                subject: true,
                topic: true
            }
        });

        if (!question) {
            return res.json({
                success: true,
                found: false
            });
        }

        res.json({
            success: true,
            found: true,
            question
        });
    } catch (error) {
        console.error('Get solution error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search for solution'
        });
    }
});

// POST /api/questions/contribute - Public contribution endpoint (requires auth)
router.post('/contribute', authenticateUser, async (req, res) => {
    try {
        const { questionName, subject, topic, link, semester, campusSlug } = req.body;
        const contributorEmail = req.user.email;

        // Validation
        if (!questionName || !subject || !topic || !link || !semester || !campusSlug) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        // Validate semester (1-8)
        const semesterNum = parseInt(semester);
        if (semesterNum < 1 || semesterNum > 8) {
            return res.status(400).json({
                success: false,
                error: 'Semester must be between 1 and 8'
            });
        }

        // Find campus
        const campus = await prisma.campus.findUnique({
            where: { slug: campusSlug }
        });

        if (!campus) {
            return res.status(404).json({
                success: false,
                error: 'Campus not found'
            });
        }

        // Create question
        const question = await prisma.question.create({
            data: {
                questionName,
                subject,
                topic,
                link,
                semester: semesterNum,
                campusId: campus.id,
                contributorEmail,
                isApproved: true, // Auto-approve for now
                approvedAt: new Date()
            },
            include: {
                campus: true,
                contributor: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        // Update contributor stats
        await prisma.user.update({
            where: { email: contributorEmail },
            data: {
                contributionCount: { increment: 1 },
                contributionPoints: { increment: 10 } // 10 points per contribution
            }
        });

        res.status(201).json({
            success: true,
            message: 'Question contributed successfully!',
            question
        });
    } catch (error) {
        console.error('Contribute question error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to contribute question'
        });
    }
});

// POST /api/questions - Create question (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
    try {
        const { questionName, subject, topic, link, semester, campusSlug } = req.body;
        const contributorEmail = req.user.email;

        if (!questionName || !subject || !topic || !link || !semester || !campusSlug) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        const campus = await prisma.campus.findUnique({
            where: { slug: campusSlug }
        });

        if (!campus) {
            return res.status(404).json({
                success: false,
                error: 'Campus not found'
            });
        }

        const question = await prisma.question.create({
            data: {
                questionName,
                subject,
                topic,
                link,
                semester: parseInt(semester),
                campusId: campus.id,
                contributorEmail,
                isApproved: true,
                approvedBy: contributorEmail,
                approvedAt: new Date()
            }
        });

        res.status(201).json({
            success: true,
            question
        });
    } catch (error) {
        console.error('Create question error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create question'
        });
    }
});

// PUT /api/questions/:id - Update question (admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { questionName, subject, topic, link, semester, campusSlug } = req.body;

        const updateData = {
            questionName,
            subject,
            topic,
            link,
            semester: parseInt(semester)
        };

        if (campusSlug) {
            const campus = await prisma.campus.findUnique({
                where: { slug: campusSlug }
            });
            if (campus) {
                updateData.campusId = campus.id;
            }
        }

        const question = await prisma.question.update({
            where: { id },
            data: updateData
        });

        res.json({
            success: true,
            question
        });
    } catch (error) {
        console.error('Update question error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update question'
        });
    }
});

// DELETE /api/questions/:id - Delete question (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.question.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Question deleted successfully'
        });
    } catch (error) {
        console.error('Delete question error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete question'
        });
    }
});

// POST /api/questions/:id/approve - Approve question (admin only)
router.post('/:id/approve', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const approvedBy = req.user.email;

        const question = await prisma.question.update({
            where: { id },
            data: {
                isApproved: true,
                approvedBy,
                approvedAt: new Date()
            }
        });

        res.json({
            success: true,
            message: 'Question approved successfully',
            question
        });
    } catch (error) {
        console.error('Approve question error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to approve question'
        });
    }
});

export default router;
