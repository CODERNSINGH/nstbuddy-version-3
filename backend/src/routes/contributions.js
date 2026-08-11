import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/contributions/leaderboard - Top contributors
router.get('/leaderboard', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const topContributors = await prisma.user.findMany({
            where: {
                contributionCount: { gt: 0 }
            },
            select: {
                name: true,
                email: true,
                picture: true,
                contributionCount: true,
                contributionPoints: true
            },
            orderBy: {
                contributionPoints: 'desc'
            },
            take: parseInt(limit)
        });

        res.json({
            success: true,
            leaderboard: topContributors.map((user, index) => ({
                rank: index + 1,
                ...user
            }))
        });
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch leaderboard'
        });
    }
});

// GET /api/contributions/my-stats - User's contribution stats
router.get('/my-stats', authenticateUser, async (req, res) => {
    try {
        const userEmail = req.user.email;

        const user = await prisma.user.findUnique({
            where: { email: userEmail },
            select: {
                name: true,
                email: true,
                picture: true,
                contributionCount: true,
                contributionPoints: true,
                questions: {
                    select: {
                        id: true,
                        questionName: true,
                        semester: true,
                        campus: {
                            select: {
                                name: true,
                                slug: true
                            }
                        },
                        createdAt: true,
                        isApproved: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Calculate user's rank
        const usersWithMorePoints = await prisma.user.count({
            where: {
                contributionPoints: { gt: user.contributionPoints }
            }
        });

        const rank = usersWithMorePoints + 1;

        res.json({
            success: true,
            stats: {
                ...user,
                rank,
                recentContributions: user.questions.slice(0, 5)
            }
        });
    } catch (error) {
        console.error('Get my stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch contribution stats'
        });
    }
});

export default router;
