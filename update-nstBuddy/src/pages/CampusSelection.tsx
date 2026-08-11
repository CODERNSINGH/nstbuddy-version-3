// src/pages/CampusSelection.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { ArrowRight, Users, BookOpen, Building2, Trophy, Flame, Sparkles, Clock, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { campusesApi, contributionsApi, questionsApi } from '../services/api';
import NoticeBoard from '../components/NoticeBoard';

interface Campus {
    id: string;
    name: string;
    slug: string;
    description: string;
    imageUrl: string;
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
    campus: { name: string; slug: string };
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

    useEffect(() => {
        fetchCampuses();
        fetchLeaderboard();
        fetchRecentQuestions();
    }, []);

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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout fullWidth>
            <div className="bg-white min-h-screen">
                {/* Hero */}
                <div className="relative pt-16 pb-14 overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/60 via-transparent to-transparent -z-10"></div>
                    <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-50/50 via-transparent to-transparent -z-10"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full py-1.5 px-4 mb-6">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-700">Built by NST students, for NST students</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-4 tracking-tight max-w-3xl">
                            Learn smarter. <span className="text-emerald-600">Together.</span>
                        </h1>
                        <p className="text-lg text-gray-600 mb-10 max-w-xl">
                            Pick your campus, browse questions by semester, and contribute back to the community.
                        </p>

                        {/* Real stats */}
                        <div className="grid grid-cols-3 gap-4 max-w-2xl">
                            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
                                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
                                    <Building2 className="w-4.5 h-4.5 text-emerald-600" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{campuses.length}</div>
                                <div className="text-xs text-gray-500">Campuses</div>
                            </div>
                            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
                                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
                                    <BookOpen className="w-4.5 h-4.5 text-emerald-600" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{totalQuestions}</div>
                                <div className="text-xs text-gray-500">Questions</div>
                            </div>
                            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
                                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
                                    <Users className="w-4.5 h-4.5 text-emerald-600" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{totalContributors}</div>
                                <div className="text-xs text-gray-500">Contributors</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <NoticeBoard />

                    {/* Campuses */}
                    <div className="mb-20">
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Browse by Campus</h2>
                                <p className="text-gray-500">Explore content from your campus community</p>
                            </div>
                        </div>

                        {campuses.length === 0 ? (
                            <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
                                <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No campuses available yet.</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-3 gap-6">
                                {campuses.map((campus) => (
                                    <div
                                        key={campus.id}
                                        onClick={() => navigate(`/campus/${campus.slug}`)}
                                        className="group cursor-pointer bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                                    >
                                        <div className="relative h-56 overflow-hidden">
                                            {campus.imageUrl ? (
                                                <img src={campus.imageUrl} alt={campus.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-600" />
                                            )}
                                            {campus.id === topCampusId && campus.questionCount > 0 && (
                                                <div className="absolute top-4 left-4 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
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
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recently Added Questions */}
                    {recentQuestions.length > 0 && (
                        <div className="mb-20">
                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Recently Added</h2>
                                    <p className="text-gray-500">Freshly contributed questions across all campuses</p>
                                </div>
                            </div>
                            <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
                                {recentQuestions.map((question) => (
                                    <a
                                        key={question.id}
                                        href={question.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group shrink-0 w-72 bg-white border border-gray-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                                                {question.subject}
                                            </span>
                                            <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 transition-colors" />
                                        </div>
                                        <h4 className="font-bold text-gray-900 text-sm mb-3 line-clamp-2">
                                            {question.questionName}
                                        </h4>
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>{question.campus.name}</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid lg:grid-cols-3 gap-6 mb-20">
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
                                                        <div className={`w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold ${style?.ring || ''}`}>
                                                            {entry.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 text-sm">{entry.name}</h4>
                                                        <p className="text-xs text-gray-500">{entry.contributionCount} contributions</p>
                                                    </div>
                                                </div>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-md ${style?.badge || 'bg-emerald-50 text-emerald-600'}`}>
                                                    {entry.contributionPoints} pts
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Contribute CTA */}
                        <div className="bg-[#0d1f17] rounded-3xl p-8 relative overflow-hidden text-white flex flex-col h-full">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[80px] opacity-30 -mr-20 -mt-20"></div>
                            <div className="relative z-10 flex-1">
                                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                                    <Users className="w-5 h-5 text-emerald-300" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Contribute a question</h3>
                                <p className="text-sm text-white/70 mb-8">
                                    Help your peers and climb the leaderboard.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/contribute')}
                                className="relative z-10 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-between text-sm transition-colors"
                            >
                                Start Contributing <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CampusSelection;
