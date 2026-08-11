import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { BookOpen, ArrowLeft, ArrowRight, Users, Flame } from 'lucide-react';
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

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
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
                        className="text-emerald-600 hover:text-emerald-700"
                    >
                        ← Back to campuses
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            {/* Header */}
            <div className="mb-10">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-500 hover:text-black mb-5 text-sm font-semibold transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Campuses
                </button>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                            {campus.name}
                        </h1>
                        <p className="text-gray-500 text-lg">
                            Select a semester to browse questions
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-3 text-center shadow-sm">
                            <div className="text-2xl font-bold text-gray-900">{totalQuestions}</div>
                            <div className="text-xs text-gray-500">Total Questions</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Semester Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-14">
                {semesters.map((semesterStat) => (
                    <div
                        key={semesterStat.semester}
                        onClick={() => navigate(`/campus/${campusSlug}/semester/${semesterStat.semester}`)}
                        className="group cursor-pointer"
                    >
                        <div className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
                            {semesterStat.semester === mostActiveSemester?.semester && semesterStat.questionCount > 0 && (
                                <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[9px] font-bold px-2 py-1 rounded-full flex items-center gap-1 z-10">
                                    <Flame className="w-2.5 h-2.5" /> Active
                                </div>
                            )}
                            {/* Semester Header */}
                            <div className="h-28 flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-emerald-50 to-white border-b border-gray-100 group-hover:from-emerald-100 transition-colors duration-300">
                                <div className="text-center text-gray-900">
                                    <div className="text-4xl font-bold mb-1 group-hover:text-emerald-700 transition-colors">
                                        {semesterStat.semester}
                                    </div>
                                    <div className="text-xs font-semibold tracking-wider uppercase text-gray-500">
                                        Semester
                                    </div>
                                </div>
                            </div>

                            {/* Semester Info */}
                            <div className="p-4 bg-white">
                                <div className="flex items-center justify-center gap-2 text-gray-700 mb-2">
                                    <BookOpen className="w-4 h-4" />
                                    <span className="font-semibold text-sm">
                                        {semesterStat.questionCount} Questions
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${(semesterStat.questionCount / maxCount) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Contribute CTA */}
            <div className="bg-[#0d1f17] rounded-3xl p-10 relative overflow-hidden text-white text-center mb-12">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-20"></div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2">
                        Want to contribute?
                    </h3>
                    <p className="text-white/70 mb-6 max-w-md mx-auto">
                        Share questions for {campus.name} and help your peers!
                    </p>
                    <button
                        onClick={() => navigate('/contribute')}
                        className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-8 rounded-xl transition-colors inline-flex items-center gap-2"
                    >
                        <Users className="w-4 h-4" /> Contribute Questions <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default SemesterSelection;
