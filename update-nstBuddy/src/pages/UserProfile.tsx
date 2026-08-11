import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../config/firebase';
import { Trophy, TrendingUp, BookOpen, Award, ExternalLink, Calendar } from 'lucide-react';
import { contributionsApi } from '../services/api';

interface ContributionStats {
    name: string;
    email: string;
    picture?: string;
    contributionCount: number;
    contributionPoints: number;
    rank: number;
    recentContributions: Array<{
        id: string;
        questionName: string;
        semester: number;
        campus: {
            name: string;
            slug: string;
        };
        createdAt: string;
        isApproved: boolean;
    }>;
}

const UserProfile: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<ContributionStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchMyStats();
        }
    }, [user]);

    const fetchMyStats = async () => {
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;

            const token = await firebaseUser.getIdToken();
            const response = await contributionsApi.getMyStats(token);

            if (response.success) {
                setStats(response.stats);
            }
        } catch (error) {
            // Error fetching stats silently
        } finally {
            setLoading(false);
        }
    };

    const getRankBadge = (rank: number) => {
        if (rank === 1) return { color: 'from-yellow-400 to-orange-400', emoji: '🥇', text: 'Champion' };
        if (rank === 2) return { color: 'from-gray-300 to-gray-400', emoji: '🥈', text: 'Runner-up' };
        if (rank === 3) return { color: 'from-orange-400 to-red-400', emoji: '🥉', text: 'Third Place' };
        if (rank <= 10) return { color: 'from-purple-400 to-pink-400', emoji: '⭐', text: 'Top 10' };
        return { color: 'from-emerald-400 to-cyan-400', emoji: '🎯', text: 'Contributor' };
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                </div>
            </Layout>
        );
    }

    if (!stats) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">No stats available</h2>
                    <p className="text-gray-600 mb-6">Start contributing to see your stats!</p>
                    <button
                        onClick={() => navigate('/contribute')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                    >
                        Contribute Now
                    </button>
                </div>
            </Layout>
        );
    }

    const rankBadge = getRankBadge(stats.rank);

    return (
        <Layout>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-black mb-2">My Profile</h1>
                <p className="text-gray-600 text-lg">Track your contributions and achievements</p>
            </div>

            {/* Profile Card */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg p-8 mb-8">
                <div className="flex items-center gap-6 mb-6">
                    {stats.picture ? (
                        <img
                            src={stats.picture}
                            alt={stats.name}
                            className="w-24 h-24 rounded-full border-4 border-gray-300"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-black font-bold text-4xl border-4 border-gray-300">
                            {stats.name.charAt(0)}
                        </div>
                    )}
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-black mb-1">{stats.name}</h2>
                        <p className="text-gray-600 mb-3">{stats.email}</p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full font-semibold">
                            <span className="text-2xl">{rankBadge.emoji}</span>
                            <span>Rank #{stats.rank} - {rankBadge.text}</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-black rounded-xl p-6 text-white border-2 border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <BookOpen className="w-8 h-8" />
                            <span className="text-4xl font-bold">{stats.contributionCount}</span>
                        </div>
                        <h3 className="text-lg font-semibold">Questions</h3>
                        <p className="text-sm text-gray-300">Total contributions</p>
                    </div>

                    <div className="bg-gray-900 rounded-xl p-6 text-white border-2 border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <Trophy className="w-8 h-8 text-yellow-400" />
                            <span className="text-4xl font-bold">{stats.contributionPoints}</span>
                        </div>
                        <h3 className="text-lg font-semibold">Points</h3>
                        <p className="text-sm text-gray-300">Total earned</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border-2 border-black">
                        <div className="flex items-center justify-between mb-4">
                            <TrendingUp className="w-8 h-8 text-black" />
                            <span className="text-4xl font-bold text-black">#{stats.rank}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-black">Rank</h3>
                        <p className="text-sm text-gray-600">On leaderboard</p>
                    </div>
                </div>
            </div>

            {/* Achievements */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg p-8 mb-8">
                <h3 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
                    <Award className="w-6 h-6 text-black" />
                    Achievements
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.contributionCount >= 1 && (
                        <div className="text-center p-4 bg-gray-50 rounded-lg border-2 border-gray-300">
                            <div className="text-4xl mb-2">🎯</div>
                            <div className="font-semibold text-black">First Contribution</div>
                            <div className="text-xs text-gray-600">Made your first contribution</div>
                        </div>
                    )}
                    {stats.contributionCount >= 5 && (
                        <div className="text-center p-4 bg-gray-50 rounded-lg border-2 border-gray-300">
                            <div className="text-4xl mb-2">🌟</div>
                            <div className="font-semibold text-black">Rising Star</div>
                            <div className="text-xs text-gray-600">5+ contributions</div>
                        </div>
                    )}
                    {stats.contributionCount >= 10 && (
                        <div className="text-center p-4 bg-gray-50 rounded-lg border-2 border-gray-300">
                            <div className="text-4xl mb-2">🚀</div>
                            <div className="font-semibold text-black">Contributor</div>
                            <div className="text-xs text-gray-600">10+ contributions</div>
                        </div>
                    )}
                    {stats.rank <= 10 && (
                        <div className="text-center p-4 bg-black rounded-lg border-2 border-gray-800">
                            <div className="text-4xl mb-2">👑</div>
                            <div className="font-semibold text-white">Top 10</div>
                            <div className="text-xs text-gray-300">Ranked in top 10</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Contributions */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-black mb-6">Recent Contributions</h3>
                {stats.recentContributions.length === 0 ? (
                    <div className="text-center py-8">
                        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">No contributions yet</p>
                        <button
                            onClick={() => navigate('/contribute')}
                            className="bg-black hover:bg-gray-900 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                        >
                            Make Your First Contribution
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {stats.recentContributions.map((contribution) => (
                            <div
                                key={contribution.id}
                                className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border-2 border-gray-200"
                            >
                                <div className="flex-1">
                                    <h4 className="font-semibold text-black mb-1">
                                        {contribution.questionName}
                                    </h4>
                                    <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="w-4 h-4" />
                                            {contribution.campus.name}
                                        </span>
                                        <span>•</span>
                                        <span>Semester {contribution.semester}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(contribution.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {contribution.isApproved ? (
                                        <span className="px-3 py-1 bg-black text-white rounded-full text-sm font-medium">
                                            ✓ Approved
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium border-2 border-gray-300">
                                            ⏳ Pending
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* CTA */}
            <div className="mt-8 bg-black rounded-2xl p-8 text-white text-center border border-gray-800">
                <h3 className="text-2xl font-bold mb-4">Keep Contributing!</h3>
                <p className="text-lg mb-6 text-gray-300">
                    Climb the leaderboard and win gifts worth ₹5,000
                </p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => navigate('/contribute')}
                        className="bg-white text-black hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition-colors"
                    >
                        Contribute More
                    </button>
                    <button
                        onClick={() => navigate('/contribute')}
                        className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                    >
                        View Leaderboard
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default UserProfile;
