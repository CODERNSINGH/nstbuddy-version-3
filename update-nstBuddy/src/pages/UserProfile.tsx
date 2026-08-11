import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../config/firebase';
import PostCard from '../components/community/PostCard';
import {
    Trophy,
    TrendingUp,
    BookOpen,
    Award,
    Calendar,
    ArrowRight,
    MessageSquare,
    Medal,
    Star,
    Target,
    Rocket,
    Crown,
    Heart,
    PenSquare,
} from 'lucide-react';
import { contributionsApi, communityApi, CommunityPost } from '../services/api';

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

const rankBadge = (rank: number) => {
    if (rank === 1) return { gradient: 'from-yellow-400 to-orange-400', Icon: Trophy, text: 'Campus Champion' };
    if (rank === 2) return { gradient: 'from-gray-300 to-gray-400', Icon: Medal, text: 'Runner-up' };
    if (rank === 3) return { gradient: 'from-orange-400 to-red-400', Icon: Medal, text: 'Third Place' };
    if (rank <= 10) return { gradient: 'from-emerald-400 to-teal-500', Icon: Star, text: 'Top 10 Contributor' };
    return { gradient: 'from-emerald-400 to-cyan-500', Icon: Target, text: 'Contributor' };
};

const UserProfile: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<ContributionStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [likesGiven, setLikesGiven] = useState<number | null>(null);
    const [repliesGiven, setRepliesGiven] = useState<number | null>(null);

    useEffect(() => {
        if (user) {
            fetchMyStats();
            fetchMyPosts();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const fetchMyPosts = async () => {
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser || !user) return;

            const token = await firebaseUser.getIdToken();
            const [postsResponse, activityResponse] = await Promise.all([
                communityApi.getPosts(token, { author: user.email, limit: 10 }),
                communityApi.getMyActivity(token),
            ]);

            if (postsResponse.success) setPosts(postsResponse.posts);
            if (activityResponse.success) {
                setLikesGiven(activityResponse.activity.likeCount);
                setRepliesGiven(activityResponse.activity.commentCount);
            }
        } catch (error) {
            // Error fetching posts silently
        } finally {
            setPostsLoading(false);
        }
    };

    const handlePostUpdated = (updated: CommunityPost) => {
        setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    };

    const handlePostDeleted = (id: string) => {
        setPosts((prev) => prev.filter((p) => p.id !== id));
    };

    const handleHashtagClick = (tag: string) => navigate(`/community?hashtag=${encodeURIComponent(tag)}`);

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
                <div className="text-center py-20">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">No stats available</h2>
                    <p className="text-gray-500 mb-6">Start contributing to build your profile.</p>
                    <button
                        onClick={() => navigate('/contribute')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-full transition-colors"
                    >
                        Contribute Now
                    </button>
                </div>
            </Layout>
        );
    }

    const badge = rankBadge(stats.rank);
    const BadgeIcon = badge.Icon;

    return (
        <Layout>
            <div className="relative -mt-2 mb-8 rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/60 via-transparent to-transparent -z-10"></div>

                <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className="relative shrink-0">
                            {stats.picture ? (
                                <img
                                    src={stats.picture}
                                    alt={stats.name}
                                    referrerPolicy="no-referrer"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md ring-2 ring-emerald-100"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-4xl border-4 border-white shadow-md ring-2 ring-emerald-100">
                                    {stats.name.charAt(0)}
                                </div>
                            )}
                            <span className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br ${badge.gradient} flex items-center justify-center border-2 border-white shadow-sm`}>
                                <BadgeIcon className="w-4 h-4 text-white" />
                            </span>
                        </div>

                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">{stats.name}</h1>
                            <p className="text-gray-500 text-sm mb-3">{stats.email}</p>
                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r ${badge.gradient} text-white text-sm font-semibold shadow-sm`}>
                                Rank #{stats.rank} · {badge.text}
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/contribute')}
                            className="hidden sm:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-2.5 px-5 rounded-full transition-colors shrink-0"
                        >
                            Contribute <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                        <BookOpen className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{stats.contributionCount}</div>
                    <div className="text-sm text-gray-500 mt-1">Questions</div>
                </div>
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
                    <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center mb-4">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{stats.contributionPoints}</div>
                    <div className="text-sm text-gray-500 mt-1">Points</div>
                </div>
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900">#{stats.rank}</div>
                    <div className="text-sm text-gray-500 mt-1">Rank</div>
                </div>
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                        <PenSquare className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{postsLoading ? '–' : posts.length}</div>
                    <div className="text-sm text-gray-500 mt-1">Posts</div>
                </div>
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center mb-4">
                        <Heart className="w-5 h-5 text-rose-500" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{likesGiven ?? '–'}</div>
                    <div className="text-sm text-gray-500 mt-1">Likes given</div>
                </div>
            </div>

            {/* Achievements */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-8">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-5">
                    <Award className="w-5 h-5 text-emerald-600" />
                    Achievements
                </h3>
                {stats.contributionCount === 0 ? (
                    <p className="text-sm text-gray-400">Contribute a question to start unlocking achievements.</p>
                ) : (
                    <div className="flex flex-wrap gap-3">
                        {stats.contributionCount >= 1 && (
                            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 text-sm font-medium px-4 py-2 rounded-full">
                                <Target className="w-4 h-4" /> First Contribution
                            </div>
                        )}
                        {stats.contributionCount >= 5 && (
                            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 text-sm font-medium px-4 py-2 rounded-full">
                                <Star className="w-4 h-4" /> Rising Star · 5+
                            </div>
                        )}
                        {stats.contributionCount >= 10 && (
                            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 text-sm font-medium px-4 py-2 rounded-full">
                                <Rocket className="w-4 h-4" /> Power Contributor · 10+
                            </div>
                        )}
                        {stats.rank <= 10 && (
                            <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium px-4 py-2 rounded-full">
                                <Crown className="w-4 h-4" /> Top 10
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Recent Contributions */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-8">
                <h3 className="font-bold text-gray-900 mb-5">Recent Contributions</h3>
                {stats.recentContributions.length === 0 ? (
                    <div className="text-center py-10">
                        <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm mb-4">No contributions yet</p>
                        <button
                            onClick={() => navigate('/contribute')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2 px-5 rounded-full transition-colors"
                        >
                            Make Your First Contribution
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {stats.recentContributions.map((contribution) => (
                            <div
                                key={contribution.id}
                                className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors"
                            >
                                <div className="min-w-0">
                                    <h4 className="font-semibold text-gray-900 text-sm truncate mb-1.5">
                                        {contribution.questionName}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                        <span>{contribution.campus.name}</span>
                                        <span>·</span>
                                        <span>Semester {contribution.semester}</span>
                                        <span>·</span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(contribution.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                </div>
                                <span
                                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
                                        contribution.isApproved
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}
                                >
                                    {contribution.isApproved ? 'Live' : 'Pending'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Community Posts */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-8">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-emerald-600" />
                        Community Posts
                    </h3>
                    {posts.length > 0 && (
                        <button
                            onClick={() => navigate(`/community?author=${encodeURIComponent(stats.email)}&authorName=${encodeURIComponent(stats.name)}`)}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                            View all
                        </button>
                    )}
                </div>

                {postsLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-10">
                        <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm mb-4">You haven't posted in the Community yet</p>
                        <button
                            onClick={() => navigate('/community')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2 px-5 rounded-full transition-colors"
                        >
                            Start a Post
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {posts.slice(0, 5).map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onUpdated={handlePostUpdated}
                                onDeleted={handlePostDeleted}
                                onHashtagClick={handleHashtagClick}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* CTA */}
            <div className="bg-[#0d1f17] rounded-3xl p-8 relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[80px] opacity-30 -mr-20 -mt-20"></div>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div>
                        <h3 className="text-xl font-bold mb-1.5">Keep climbing the leaderboard</h3>
                        <p className="text-sm text-white/70">Contribute more questions or join the conversation in Community.</p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <button
                            onClick={() => navigate('/contribute')}
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm py-2.5 px-5 rounded-xl transition-colors"
                        >
                            Contribute <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => navigate('/community')}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm py-2.5 px-5 rounded-xl transition-colors"
                        >
                            <MessageSquare className="w-4 h-4" /> Community
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default UserProfile;
