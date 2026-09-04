// src/pages/CampusSelection.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { ArrowRight, Users, BookOpen, Building2, Trophy, Flame, Sparkles, Clock, ExternalLink, GraduationCap, Layers, MessageSquare, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { campusesApi, contributionsApi, questionsApi, communityApi, CommunityPost } from '../services/api';
import NoticeBoard from '../components/NoticeBoard';
import Announcements from '../components/Announcements';
import Avatar from '../components/community/Avatar';
import HeroFeatureShowcase from '../components/home/HeroFeatureShowcase';
import CountUp from '../components/home/CountUp';
import Reveal from '../components/home/Reveal';
import { motion } from 'framer-motion';

type BrowseMode = 'campus' | 'course';

interface Campus {
    id: string;
    name: string;
    slug: string;
    description: string;
    imageUrl: string;
    questionCount: number;
}

interface CustomCourse {
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    questionCount: number;
}

interface LeaderboardEntry {
    rank: number;
    name: string;
    picture?: string;
    contributionCount: number;
    contributionPoints: number;
}

interface RecentQuestion {
    id: string;
    questionName: string;
    subject: string;
    link: string;
    createdAt: string;
    campus: { name: string; slug: string } | null;
    customCourse: string | null;
}

const rankStyles: Record<number, { ring: string; badge: string }> = {
    1: { ring: 'ring-2 ring-yellow-400', badge: 'bg-yellow-400 text-yellow-900' },
    2: { ring: 'ring-2 ring-gray-300', badge: 'bg-gray-300 text-gray-800' },
    3: { ring: 'ring-2 ring-orange-400', badge: 'bg-orange-400 text-orange-900' },
};

const CampusSelection: React.FC = () => {
    const navigate = useNavigate();
    const [campuses, setCampuses] = useState<Campus[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [totalContributors, setTotalContributors] = useState(0);
    const [recentQuestions, setRecentQuestions] = useState<RecentQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [browseMode, setBrowseMode] = useState<BrowseMode>('campus');
    const [customCourses, setCustomCourses] = useState<CustomCourse[]>([]);
    const [recentPosts, setRecentPosts] = useState<CommunityPost[]>([]);

    useEffect(() => {
        fetchCampuses();
        fetchLeaderboard();
        fetchRecentQuestions();
        fetchCustomCourses();
        fetchRecentPosts();
    }, []);

    const fetchRecentPosts = async () => {
        try {
            const response = await communityApi.getPosts(undefined, { limit: 4, sort: 'new' });
            if (response.success) setRecentPosts(response.posts);
        } catch (error) {
            // Error fetching recent posts silently
        }
    };

    const fetchCustomCourses = async () => {
        try {
            const response = await questionsApi.getCustomCourses();
            if (response.success) setCustomCourses(response.courses);
        } catch (error) {
            // Error fetching custom courses silently
        }
    };

    const fetchCampuses = async () => {
        try {
            const response = await campusesApi.getAll();
            if (response.success) {
                const sortedCampuses = response.campuses.sort(
                    (a: Campus, b: Campus) => b.questionCount - a.questionCount
                );
                setCampuses(sortedCampuses);
            }
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const response = await contributionsApi.getLeaderboard(100);
            if (response.success) {
                setTotalContributors(response.leaderboard.length);
                setLeaderboard(response.leaderboard.slice(0, 5));
            }
        } catch (error) {
        }
    };

    const fetchRecentQuestions = async () => {
        try {
            const response = await questionsApi.getAll({ limit: 6 });
            if (response.success) {
                setRecentQuestions(response.questions);
            }
        } catch (error) {
        }
    };

    const totalQuestions = campuses.reduce((sum, c) => sum + c.questionCount, 0);
    const topCampusId = campuses[0]?.id;

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout fullWidth>
            <div className="bg-white min-h-screen">
                {/* Hero */}
                <div className="relative pt-16 pb-14 overflow-hidden">
                    <div
                        className="absolute inset-0 -z-20 opacity-[0.35]"
                        style={{
                            backgroundImage:
                                'linear-gradient(to right, rgba(65,71,85,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(65,71,85,0.08) 1px, transparent 1px)',
                            backgroundSize: '48px 48px',
                            maskImage: 'radial-gradient(ellipse at top, black, transparent 70%)',
                            WebkitMaskImage: 'radial-gradient(ellipse at top, black, transparent 70%)',
                        }}
                    ></div>
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-100/60 via-transparent to-transparent -z-10"></div>
                    <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-brand-50/50 via-transparent to-transparent -z-10"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-full py-1.5 px-4 mb-6">
                                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                                    <span className="text-xs font-bold text-brand-700">Built by NST students, for NST students</span>
                                </div>

                                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-4 tracking-tight">
                                    Learn smarter. <span className="text-brand-600">Together.</span>
                                </h1>
                                <p className="text-lg text-gray-600 mb-10 max-w-xl">
                                    Pick your campus, browse questions by semester, and contribute back to the community.
                                </p>

                                {/* Real stats */}
                                <div className="grid grid-cols-3 gap-4 max-w-2xl">
                                    <motion.div whileHover={{ y: -4 }} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
                                        <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center mb-3">
                                            <Building2 className="w-4.5 h-4.5 text-brand-600" />
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900"><CountUp value={campuses.length} /></div>
                                        <div className="text-xs text-gray-500">Campuses</div>
                                    </motion.div>
                                    <motion.div whileHover={{ y: -4 }} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
                                        <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center mb-3">
                                            <BookOpen className="w-4.5 h-4.5 text-brand-600" />
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900"><CountUp value={totalQuestions} /></div>
                                        <div className="text-xs text-gray-500">Questions</div>
                                    </motion.div>
                                    <motion.div whileHover={{ y: -4 }} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
                                        <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center mb-3">
                                            <Users className="w-4.5 h-4.5 text-brand-600" />
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900"><CountUp value={totalContributors} /></div>
                                        <div className="text-xs text-gray-500">Contributors</div>
                                    </motion.div>
                                </div>
                            </div>

                            <HeroFeatureShowcase navigate={navigate} />
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Announcements />
                    <NoticeBoard />

                    {/* Campuses / Other Courses */}
                    <Reveal className="mb-28">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    {browseMode === 'campus' ? 'Browse by Campus' : 'Browse Other Courses'}
                                </h2>
                                <p className="text-gray-500">
                                    {browseMode === 'campus' ? 'Explore content from your campus community' : 'Questions grouped by course, not by semester'}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1 shrink-0 w-fit">
                                <button
                                    onClick={() => setBrowseMode('campus')}
                                    className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
                                        browseMode === 'campus' ? 'bg-white shadow-sm text-brand-700' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <GraduationCap className="w-4 h-4" /> Campuses
                                </button>
                                <button
                                    onClick={() => setBrowseMode('course')}
                                    className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
                                        browseMode === 'course' ? 'bg-white shadow-sm text-brand-700' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Layers className="w-4 h-4" /> Other Courses
                                </button>
                            </div>
                        </div>

                        {browseMode === 'campus' ? (
                            campuses.length === 0 ? (
                                <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
                                    <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No campuses available yet.</p>
                                </div>
                            ) : (
                <div className="grid md:grid-cols-3 gap-6">
                                    {campuses.map((campus) => (
                                        <motion.div
                                            key={campus.id}
                                            onClick={() => navigate(`/campus/${campus.slug}`)}
                                            whileHover={{ y: -6 }}
                                            className="group cursor-pointer bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300"
                                        >
                                            <div className="relative h-56 overflow-hidden">
                                                {campus.imageUrl ? (
                                                    <img src={campus.imageUrl} alt={campus.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-brand-400 to-brand-600" />
                                                )}
                                                {campus.id === topCampusId && campus.questionCount > 0 && (
                                                    <div className="absolute top-4 left-4 bg-brand-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                                                        <Flame className="w-3 h-3" /> Most Active
                                                    </div>
                                                )}
                                                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/80 to-transparent"></div>
                                                <div className="absolute bottom-4 left-6 right-6">
                                                    <h3 className="text-xl font-bold text-white">{campus.name}</h3>
                                                </div>
                                            </div>
                                            <div className="p-5 flex justify-between items-center bg-white">
                                                <span className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                                                    <BookOpen className="w-4 h-4" /> {campus.questionCount} Questions
                                                </span>
                                                <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-black group-hover:text-white group-hover:border-black transition-colors">
                                                    <ArrowRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )
                        ) : customCourses.length === 0 ? (
                            <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
                                <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No custom courses yet — contribute one from the "Others" tab.</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-3 gap-6">
                                {customCourses.map((course) => (
                                    <motion.div
                                        key={course.name}
                                        onClick={() => navigate(`/course/${encodeURIComponent(course.name)}`)}
                                        whileHover={{ y: -6 }}
                                        className="group cursor-pointer bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col"
                                    >
                                        {course.imageUrl ? (
                                            <div className="relative h-40 overflow-hidden">
                                                <img
                                                    src={course.imageUrl}
                                                    alt={course.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-black/80 to-transparent"></div>
                                                <div className="absolute bottom-4 left-6 right-6">
                                                    <h3 className="text-lg font-bold text-white">{course.name}</h3>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-6 pb-0">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white mb-5">
                                                    <Layers className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900">{course.name}</h3>
                                            </div>
                                        )}

                                        <div className="p-6 flex-1 flex flex-col">
                                            {course.description && (
                                                <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{course.description}</p>
                                            )}
                                            <div className={`flex justify-between items-center ${course.description ? 'pt-4 border-t border-gray-50' : 'flex-1 items-end'}`}>
                                                <span className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                                                    <BookOpen className="w-4 h-4" /> {course.questionCount} Questions
                                                </span>
                                                <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-black group-hover:text-white group-hover:border-black transition-colors">
                                                    <ArrowRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </Reveal>

                    {/* Recently Added Questions */}
                    {recentQuestions.length > 0 && (
                        <Reveal className="mb-28">
                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Recently Added</h2>
                                    <p className="text-gray-500">Freshly contributed questions across all campuses</p>
                                </div>
                            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
                                {recentQuestions.map((question) => (
                                    <motion.a
                                        key={question.id}
                                        href={question.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        whileHover={{ y: -4 }}
                                        className="group shrink-0 w-72 bg-white border border-gray-200 rounded-2xl p-5 hover:border-brand-300 hover:shadow-md transition-[border-color,box-shadow]"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
                                                {question.subject}
                                            </span>
                                            <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-brand-600 transition-colors" />
                                        </div>
                                        <h4 className="font-bold text-gray-900 text-sm mb-3 line-clamp-2">
                                            {question.questionName}
                                        </h4>
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>{question.campus?.name ?? question.customCourse}</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </motion.a>
                                ))}
                            </div>
                        </Reveal>
                    )}

                    {/* Recently in Community */}
                    {recentPosts.length > 0 && (
                        <Reveal className="mb-28">
                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Recently in Community</h2>
                                    <p className="text-gray-500">Fresh posts from students across campuses</p>
                                </div>
                                <button
                                    onClick={() => navigate('/community')}
                                    className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 shrink-0"
                                >
                                    View all <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
                                {recentPosts.map((post) => (
                                    <motion.button
                                        key={post.id}
                                        onClick={() => navigate(`/community?post=${post.id}`)}
                                        whileHover={{ y: -4 }}
                                        className="group text-left shrink-0 w-72 bg-white border border-gray-200 rounded-2xl p-5 hover:border-brand-300 hover:shadow-md transition-[border-color,box-shadow]"
                                    >
                                        <div className="flex items-center gap-2.5 mb-3">
                                            <Avatar name={post.author.name} picture={post.author.picture} size="sm" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{post.author.name}</p>
                                                <p className="text-[11px] text-gray-400">
                                                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 line-clamp-3 mb-4 min-h-[3.75rem]">{post.content}</p>
                                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-50">
                                            <span className="flex items-center gap-1">
                                                <Heart className="w-3.5 h-3.5" /> {post.likeCount}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="w-3.5 h-3.5" /> {post.commentCount}
                                            </span>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </Reveal>
                    )}

                    <Reveal className="grid lg:grid-cols-3 gap-6 mb-20">
                        {/* Top Contributors */}
                        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-yellow-500" /> Top Contributors
                                </h3>
                            </div>
                            {leaderboard.length === 0 ? (
                                <p className="text-sm text-gray-500 py-6 text-center">No contributions yet — be the first!</p>
                            ) : (
                                <div className="space-y-5">
                                    {leaderboard.map((entry) => {
                                        const style = rankStyles[entry.rank];
                                        return (
                                            <div key={entry.rank} className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs font-bold text-gray-400 w-3">{entry.rank}</span>
                                                    {entry.picture ? (
                                                        <img
                                                            src={entry.picture}
                                                            alt={entry.name}
                                                            referrerPolicy="no-referrer"
                                                            className={`w-10 h-10 rounded-full ${style?.ring || ''}`}
                                                        />
                                                    ) : (
                                                        <div className={`w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold ${style?.ring || ''}`}>
                                                            {entry.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 text-sm">{entry.name}</h4>
                                                        <p className="text-xs text-gray-500">{entry.contributionCount} contributions</p>
                                                    </div>
                                                </div>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-md ${style?.badge || 'bg-brand-50 text-brand-600'}`}>
                                                    {entry.contributionPoints} pts
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Contribute CTA */}
                        <div className="bg-[#16191D] rounded-3xl p-8 relative overflow-hidden text-white flex flex-col h-full">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 rounded-full blur-[80px] opacity-30 -mr-20 -mt-20"></div>
                            <div className="relative z-10 flex-1">
                                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                                    <Users className="w-5 h-5 text-brand-300" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Contribute a question</h3>
                                <p className="text-sm text-white/70 mb-8">
                                    Help your peers and climb the leaderboard.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/contribute')}
                                className="relative z-10 bg-brand-500 hover:bg-brand-400 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-between text-sm transition-colors"
                            >
                                Start Contributing <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </Reveal>
                </div>
            </div>
        </Layout>
    );
};

export default CampusSelection;
