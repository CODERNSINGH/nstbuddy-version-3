import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../config/firebase';
import PostCard from '../components/community/PostCard';
import GroupCard from '../components/groups/GroupCard';
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
    Users2,
} from 'lucide-react';
import { contributionsApi, communityApi, groupsApi, CommunityPost, GroupSummary } from '../services/api';

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

type Tab = 'contributions' | 'posts' | 'groups';

const rankBadge = (rank: number) => {
    if (rank === 1) return { gradient: 'from-yellow-400 to-orange-400', Icon: Trophy, text: 'Campus Champion' };
    if (rank === 2) return { gradient: 'from-gray-300 to-gray-400', Icon: Medal, text: 'Runner-up' };
    if (rank === 3) return { gradient: 'from-orange-400 to-red-400', Icon: Medal, text: 'Third Place' };
    if (rank <= 10) return { gradient: 'from-brand-400 to-teal-500', Icon: Star, text: 'Top 10 Contributor' };
    return { gradient: 'from-brand-400 to-cyan-500', Icon: Target, text: 'Contributor' };
};

const UserProfile: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<ContributionStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>('contributions');

    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [likesGiven, setLikesGiven] = useState<number | null>(null);

    const [groups, setGroups] = useState<GroupSummary[]>([]);
    const [groupsLoading, setGroupsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchMyStats();
            fetchMyPosts();
            fetchMyGroups();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchMyStats = async () => {
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();
            const response = await contributionsApi.getMyStats(token);
            if (response.success) setStats(response.stats);
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
            if (activityResponse.success) setLikesGiven(activityResponse.activity.likeCount);
        } catch (error) {
            // Error fetching posts silently
        } finally {
            setPostsLoading(false);
        }
    };

    const fetchMyGroups = async () => {
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();
            const response = await groupsApi.getMy(token);
            if (response.success) setGroups(response.groups);
        } catch (error) {
            // Error fetching groups silently
        } finally {
            setGroupsLoading(false);
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
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
                        className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 px-6 rounded-full transition-colors"
                    >
                        Contribute Now
                    </button>
                </div>
            </Layout>
        );
    }

    const badge = rankBadge(stats.rank);
    const BadgeIcon = badge.Icon;

    const statRows = [
        { label: 'Questions contributed', value: stats.contributionCount, icon: BookOpen },
        { label: 'Points earned', value: stats.contributionPoints, icon: Trophy },
        { label: 'Leaderboard rank', value: `#${stats.rank}`, icon: TrendingUp },
        { label: 'Community posts', value: postsLoading ? '–' : posts.length, icon: PenSquare },
        { label: 'Likes given', value: likesGiven ?? '–', icon: Heart },
        { label: 'Groups', value: groupsLoading ? '–' : groups.length, icon: Users2 },
    ];

    return (
        <Layout fullWidth>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                {/* Banner + overlapping avatar */}
                <div className="relative h-36 sm:h-44 rounded-3xl overflow-hidden -mx-px">
                    <div className="absolute inset-0 bg-[#16191D]" />
                    <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500 rounded-full blur-[100px] opacity-40 -mr-24 -mt-24" />
                    <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-400 rounded-full blur-[90px] opacity-20 -mb-32" />
                </div>

                <div className="px-2 sm:px-4">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-14 mb-8">
                        <div className="flex items-end gap-4">
                            <div className="relative shrink-0">
                                {stats.picture ? (
                                    <img
                                        src={stats.picture}
                                        alt={stats.name}
                                        referrerPolicy="no-referrer"
                                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white shadow-md"
                                    />
                                ) : (
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-4xl border-4 border-white shadow-md">
                                        {stats.name.charAt(0)}
                                    </div>
                                )}
                                <span className={`absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-gradient-to-br ${badge.gradient} flex items-center justify-center border-2 border-white shadow-sm`}>
                                    <BadgeIcon className="w-4.5 h-4.5 text-white" />
                                </span>
                            </div>
                            <div className="pb-1">
                                <h1 className="text-2xl font-bold text-gray-900">{stats.name}</h1>
                                <p className="text-gray-500 text-sm">{stats.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pb-1">
                            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r ${badge.gradient} text-white text-xs font-semibold shadow-sm`}>
                                Rank #{stats.rank} · {badge.text}
                            </span>
                            <button
                                onClick={() => navigate('/contribute')}
                                className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm py-2 px-4 rounded-full transition-colors shrink-0"
                            >
                                Contribute <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 items-start">
                        {/* Sidebar */}
                        <aside className="space-y-4 lg:sticky lg:top-20">
                            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                                {statRows.map((row, i) => (
                                    <div
                                        key={row.label}
                                        className={`flex items-center justify-between px-5 py-3.5 ${i !== statRows.length - 1 ? 'border-b border-gray-50' : ''}`}
                                    >
                                        <span className="flex items-center gap-2.5 text-sm text-gray-500">
                                            <row.icon className="w-4 h-4 text-gray-400" />
                                            {row.label}
                                        </span>
                                        <span className="font-bold text-gray-900 text-sm">{row.value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Achievements</h3>
                                {stats.contributionCount === 0 ? (
                                    <p className="text-xs text-gray-400">Contribute a question to unlock achievements.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {stats.contributionCount >= 1 && (
                                            <span className="flex items-center gap-1.5 bg-brand-50 text-brand-800 text-xs font-medium px-3 py-1.5 rounded-full">
                                                <Target className="w-3.5 h-3.5" /> First Contribution
                                            </span>
                                        )}
                                        {stats.contributionCount >= 5 && (
                                            <span className="flex items-center gap-1.5 bg-brand-50 text-brand-800 text-xs font-medium px-3 py-1.5 rounded-full">
                                                <Star className="w-3.5 h-3.5" /> Rising Star
                                            </span>
                                        )}
                                        {stats.contributionCount >= 10 && (
                                            <span className="flex items-center gap-1.5 bg-brand-50 text-brand-800 text-xs font-medium px-3 py-1.5 rounded-full">
                                                <Rocket className="w-3.5 h-3.5" /> Power Contributor
                                            </span>
                                        )}
                                        {stats.rank <= 10 && (
                                            <span className="flex items-center gap-1.5 bg-gradient-to-r from-brand-500 to-teal-500 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                                                <Crown className="w-3.5 h-3.5" /> Top 10
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="bg-[#16191D] rounded-2xl p-5 relative overflow-hidden text-white">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-brand-500 rounded-full blur-[60px] opacity-30 -mr-14 -mt-14" />
                                <div className="relative z-10">
                                    <h3 className="text-sm font-bold mb-1">Keep building your standing</h3>
                                    <p className="text-xs text-white/60 mb-4">Contribute, post, or start a group.</p>
                                    <button
                                        onClick={() => navigate('/groups')}
                                        className="flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 py-2 px-3.5 rounded-lg transition-colors w-full justify-center"
                                    >
                                        <Users2 className="w-3.5 h-3.5" /> Browse Groups
                                    </button>
                                </div>
                            </div>
                        </aside>

                        {/* Main content */}
                        <div>
                            <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-full p-1 mb-5 w-fit">
                                {([
                                    { id: 'contributions' as Tab, label: 'Contributions' },
                                    { id: 'posts' as Tab, label: 'Posts' },
                                    { id: 'groups' as Tab, label: 'Groups' },
                                ]).map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTab(t.id)}
                                        className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
                                            tab === t.id ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {tab === 'contributions' && (
                                stats.recentContributions.length === 0 ? (
                                    <div className="bg-white border border-dashed border-gray-200 rounded-2xl text-center py-14">
                                        <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm mb-4">No contributions yet</p>
                                        <button
                                            onClick={() => navigate('/contribute')}
                                            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-2 px-5 rounded-full transition-colors"
                                        >
                                            Make Your First Contribution
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {stats.recentContributions.map((contribution) => (
                                            <div
                                                key={contribution.id}
                                                className="flex items-center justify-between gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-brand-200 transition-colors"
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
                                                            ? 'bg-brand-100 text-brand-700'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    {contribution.isApproved ? 'Live' : 'Pending'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}

                            {tab === 'posts' && (
                                postsLoading ? (
                                    <div className="flex items-center justify-center py-14">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                                    </div>
                                ) : posts.length === 0 ? (
                                    <div className="bg-white border border-dashed border-gray-200 rounded-2xl text-center py-14">
                                        <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm mb-4">You haven't posted in the Community yet</p>
                                        <button
                                            onClick={() => navigate('/community')}
                                            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-2 px-5 rounded-full transition-colors"
                                        >
                                            Start a Post
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {posts.map((post) => (
                                            <PostCard
                                                key={post.id}
                                                post={post}
                                                onUpdated={handlePostUpdated}
                                                onDeleted={handlePostDeleted}
                                                onHashtagClick={handleHashtagClick}
                                            />
                                        ))}
                                    </div>
                                )
                            )}

                            {tab === 'groups' && (
                                groupsLoading ? (
                                    <div className="flex items-center justify-center py-14">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                                    </div>
                                ) : groups.length === 0 ? (
                                    <div className="bg-white border border-dashed border-gray-200 rounded-2xl text-center py-14">
                                        <Users2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm mb-4">You haven't joined or created any groups yet</p>
                                        <button
                                            onClick={() => navigate('/groups')}
                                            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-2 px-5 rounded-full transition-colors"
                                        >
                                            Browse Groups
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {groups.map((group) => (
                                            <GroupCard key={group.id} group={group} onClick={() => navigate(`/groups/${group.id}`)} />
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default UserProfile;
