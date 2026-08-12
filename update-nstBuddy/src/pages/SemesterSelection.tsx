import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import CountUp from '../components/home/CountUp';
import { BookOpen, ArrowLeft, ArrowRight, Users, Flame, Layers, TrendingUp, Sparkles } from 'lucide-react';
import { campusesApi } from '../services/api';

interface SemesterStat {
    semester: number;
    questionCount: number;
}

interface CampusInfo {
    id: string;
    name: string;
    slug: string;
}

const SemesterSelection: React.FC = () => {
    const { campusSlug } = useParams<{ campusSlug: string }>();
    const navigate = useNavigate();
    const [campus, setCampus] = useState<CampusInfo | null>(null);
    const [semesters, setSemesters] = useState<SemesterStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSemesterStats();
    }, [campusSlug]);

    const fetchSemesterStats = async () => {
        try {
            const response = await campusesApi.getSemesters(campusSlug!);
            if (response.success) {
                setCampus(response.campus);
                setSemesters(response.semesters);
            }
        } catch (error) {
            // Error fetching semester stats silently
        } finally {
            setLoading(false);
        }
    };

    const totalQuestions = semesters.reduce((sum, s) => sum + s.questionCount, 0);
    const maxCount = Math.max(1, ...semesters.map((s) => s.questionCount));
    const mostActiveSemester = semesters.reduce(
        (top, s) => (s.questionCount > top.questionCount ? s : top),
        semesters[0] || { semester: 0, questionCount: 0 }
    );
    const activeCount = semesters.filter((s) => s.questionCount > 0).length;

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
                </div>
            </Layout>
        );
    }

    if (!campus) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Campus not found</h2>
                    <button
                        onClick={() => navigate('/')}
                        className="text-brand-600 hover:text-brand-700"
                    >
                        ← Back to campuses
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout fullWidth>
            <div className="bg-white min-h-screen">
                {/* Hero */}
                <div className="relative pt-12 pb-14 overflow-hidden">
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

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm font-semibold transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Campuses
                        </button>

                        <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-full py-1.5 px-4 mb-5">
                            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                            <span className="text-xs font-bold text-brand-700">Campus</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-4 tracking-tight max-w-3xl">
                            {campus.name}
                        </h1>
                        <p className="text-lg text-gray-600 mb-10 max-w-xl">
                            Pick a semester to browse the questions your peers have shared.
                        </p>

                        {/* Real stats */}
                        <div className="grid grid-cols-3 gap-4 max-w-2xl">
                            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
                                <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center mb-3">
                                    <BookOpen className="w-4.5 h-4.5 text-brand-600" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900"><CountUp value={totalQuestions} /></div>
                                <div className="text-xs text-gray-500">Questions</div>
                            </div>
                            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
                                <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center mb-3">
                                    <Layers className="w-4.5 h-4.5 text-brand-600" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900"><CountUp value={activeCount} /></div>
                                <div className="text-xs text-gray-500">Active Semesters</div>
                            </div>
                            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
                                <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center mb-3">
                                    <TrendingUp className="w-4.5 h-4.5 text-brand-600" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {mostActiveSemester?.questionCount > 0 ? `S${mostActiveSemester.semester}` : '–'}
                                </div>
                                <div className="text-xs text-gray-500">Most Active</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                    {/* Semester Grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
                        {semesters.map((semesterStat, i) => {
                            const isActive = semesterStat.semester === mostActiveSemester?.semester && semesterStat.questionCount > 0;
                            const pct = Math.round((semesterStat.questionCount / maxCount) * 100);
                            return (
                                <motion.button
                                    key={semesterStat.semester}
                                    onClick={() => navigate(`/campus/${campusSlug}/semester/${semesterStat.semester}`)}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: i * 0.06 }}
                                    whileHover={{ y: -6 }}
                                    className="group relative text-left bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-brand-200 transition-[box-shadow,border-color] duration-300 p-6"
                                >
                                    <span className="absolute -right-3 -top-8 text-[7rem] font-black text-gray-900/[0.04] leading-none select-none">
                                        {semesterStat.semester}
                                    </span>

                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-8">
                                            <div
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${
                                                    isActive ? 'bg-brand-600 text-white' : 'bg-gray-50 text-gray-500 group-hover:bg-brand-50 group-hover:text-brand-600'
                                                }`}
                                            >
                                                {String(semesterStat.semester).padStart(2, '0')}
                                            </div>
                                            {isActive && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                                                    <Flame className="w-2.5 h-2.5" /> Active
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-900 mb-1">Semester {semesterStat.semester}</h3>
                                        <p className="text-xs text-gray-500 mb-4">{semesterStat.questionCount} Questions</p>

                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                                            <div
                                                className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-500"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                            <span className="text-xs font-semibold text-brand-600 group-hover:underline">
                                                View questions
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Contribute CTA */}
                    <div className="bg-[#16191D] rounded-3xl p-10 relative overflow-hidden text-white text-center">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-brand-500 rounded-full blur-[100px] opacity-20"></div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold mb-2">
                                Want to contribute?
                            </h3>
                            <p className="text-white/70 mb-6 max-w-md mx-auto">
                                Share questions for {campus.name} and help your peers!
                            </p>
                            <button
                                onClick={() => navigate('/contribute')}
                                className="bg-brand-500 hover:bg-brand-400 text-white font-bold py-3 px-8 rounded-xl transition-colors inline-flex items-center gap-2"
                            >
                                <Users className="w-4 h-4" /> Contribute Questions <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SemesterSelection;
