import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, authenticateUser } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/questions/course-options - admin-defined course names for the "Others" contribute dropdown
router.get('/course-options', async (req, res) => {
    try {
        const courses = await prisma.customCourse.findMany({
            orderBy: { name: 'asc' },
            select: { name: true },
        });
        res.json({ success: true, courses: courses.map((c) => c.name) });
    } catch (error) {
        console.error('Get course options error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch course options' });
    }
});

// GET /api/questions/subjects - all distinct subjects site-wide, for the contribute-form autocomplete
router.get('/subjects', async (req, res) => {
    try {
        const rows = await prisma.question.findMany({
            where: { isApproved: true },
            select: { subject: true },
            distinct: ['subject'],
        });
        res.json({ success: true, subjects: rows.map((r) => r.subject).sort() });
    } catch (error) {
        console.error('Get subjects error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch subjects' });
    }
});

// GET /api/questions - Get all questions with filtering
router.get('/', async (req, res) => {
    try {
        const { semester, subject, topic, search, campus, customCourse, limit } = req.query;

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

        if (customCourse) {
            where.customCourse = customCourse;
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

// GET /api/questions/custom-courses - admin-defined courses (with image/description) + real question counts,
// used for the homepage's "Other Courses" browse grid
router.get('/custom-courses', async (req, res) => {
    try {
        const [courses, grouped] = await Promise.all([
            prisma.customCourse.findMany({ orderBy: { name: 'asc' } }),
            prisma.question.groupBy({
                by: ['customCourse'],
                where: { isApproved: true, customCourse: { not: null } },
                _count: { customCourse: true }
            })
        ]);

        const countMap = Object.fromEntries(grouped.map((g) => [g.customCourse, g._count.customCourse]));

        res.json({
            success: true,
            courses: courses
                .map((c) => ({
                    name: c.name,
                    description: c.description,
                    imageUrl: c.imageUrl,
                    questionCount: countMap[c.name] || 0
                }))
                .sort((a, b) => b.questionCount - a.questionCount)
        });
    } catch (error) {
        console.error('Get custom courses error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch custom courses'
        });
    }
});

// GET /api/questions/filters - Get unique subjects and topics for filtering
router.get('/filters', async (req, res) => {
    try {
        const { semester, campus, customCourse } = req.query;

        const where = { isApproved: true };

        if (campus) {
            const campusRecord = await prisma.campus.findUnique({
                where: { slug: campus }
            });
            if (campusRecord) {
                where.campusId = campusRecord.id;
            }
        }

        if (customCourse) {
            where.customCourse = customCourse;
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
// Supports two mutually-exclusive flows: College (campusSlug + semester) or Others (customCourse, free text)
router.post('/contribute', authenticateUser, async (req, res) => {
    try {
        const { questionName, subject, topic, link, semester, campusSlug, customCourse } = req.body;
        const contributorEmail = req.user.email;

        if (!questionName || !subject || !topic || !link) {
            return res.status(400).json({
                success: false,
                error: 'Question title, subject, topic, and link are required'
            });
        }

        const trimmedCourse = (customCourse || '').trim();
        let campusId = null;
        let semesterNum = null;

        if (trimmedCourse) {
            const course = await prisma.customCourse.findUnique({ where: { name: trimmedCourse } });
            if (!course) {
                return res.status(400).json({ success: false, error: 'Pick a course from the list - only admins can add new courses' });
            }
        } else {
            if (!campusSlug || !semester) {
                return res.status(400).json({ success: false, error: 'Select a campus and semester, or switch to "Others" and pick a course' });
            }

            semesterNum = parseInt(semester);
            if (semesterNum < 1 || semesterNum > 8) {
                return res.status(400).json({ success: false, error: 'Semester must be between 1 and 8' });
            }

            const campus = await prisma.campus.findUnique({ where: { slug: campusSlug } });
            if (!campus) return res.status(404).json({ success: false, error: 'Campus not found' });
            campusId = campus.id;
        }

        const question = await prisma.question.create({
            data: {
                questionName,
                subject,
                topic,
                link,
                semester: semesterNum,
                campusId,
                customCourse: trimmedCourse || null,
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
        const { questionName, subject, topic, link, semester, campusSlug, customCourse } = req.body;
        const contributorEmail = req.user.email;

        if (!questionName || !subject || !topic || !link) {
            return res.status(400).json({
                success: false,
                error: 'Question title, subject, topic, and link are required'
            });
        }

        const trimmedCourse = (customCourse || '').trim();
        let campusId = null;
        let semesterNum = null;

        if (trimmedCourse) {
            // Others flow - no campus/semester needed
        } else {
            if (!campusSlug || !semester) {
                return res.status(400).json({ success: false, error: 'Select a campus and semester, or provide a custom course name' });
            }
            const campus = await prisma.campus.findUnique({ where: { slug: campusSlug } });
            if (!campus) return res.status(404).json({ success: false, error: 'Campus not found' });
            campusId = campus.id;
            semesterNum = parseInt(semester);
        }

        const question = await prisma.question.create({
            data: {
                questionName,
                subject,
                topic,
                link,
                semester: semesterNum,
                campusId,
                customCourse: trimmedCourse || null,
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
        const { questionName, subject, topic, link, semester, campusSlug, customCourse } = req.body;

        const trimmedCourse = (customCourse || '').trim();

        const updateData = {
            questionName,
            subject,
            topic,
            link,
            customCourse: trimmedCourse || null,
            semester: trimmedCourse ? null : (semester ? parseInt(semester) : null)
        };

        if (trimmedCourse) {
            updateData.campusId = null;
        } else if (campusSlug) {
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
