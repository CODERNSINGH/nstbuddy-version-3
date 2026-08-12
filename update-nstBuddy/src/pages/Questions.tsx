import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { BookOpen, User, Search, Plus, ChevronRight, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { questionsApi } from '../services/api';

interface Question {
    id: string;
    questionName: string;
    subject: string;
    topic: string;
    link: string;
    semester: number;
    campus: {
        name: string;
        slug: string;
    };
    contributor: {
        name: string;
        email: string;
        picture?: string;
    };
    createdAt: string;
}

const Questions: React.FC = () => {
    const { campusSlug, semesterId, courseName } = useParams<{ campusSlug?: string; semesterId?: string; courseName?: string }>();
    const navigate = useNavigate();
    const decodedCourseName = courseName ? decodeURIComponent(courseName) : undefined;
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [subjects, setSubjects] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
        fetchQuestions();
        fetchFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campusSlug, semesterId, decodedCourseName, selectedSubject]);

    const fetchQuestions = async () => {
        try {
            const params: any = decodedCourseName
                ? { customCourse: decodedCourseName }
                : { campus: campusSlug, semester: semesterId };
            if (selectedSubject) {
                params.subject = selectedSubject;
            }

            const response = await questionsApi.getAll(params);
            if (response.success) {
                setQuestions(response.questions);
            }
        } catch (error) {
            // Error fetching questions silently
        } finally {
            setLoading(false);
        }
    };

    const fetchFilters = async () => {
        try {
            const response = await questionsApi.getFilters(
                decodedCourseName ? { customCourse: decodedCourseName } : { campus: campusSlug, semester: semesterId }
            );
            if (response.success) {
                setSubjects(response.subjects);
            }
        } catch (error) {
            // Error fetching filters silently
        }
    };

    const filteredQuestions = questions.filter(q =>
        q.questionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.topic.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const subjectCounts = subjects.reduce<Record<string, number>>((acc, subject) => {
        acc[subject] = questions.filter((q) => q.subject === subject).length;
        return acc;
    }, {});

    if (loading) {
        return (
            <Layout fullWidth>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout fullWidth>
            <div className="flex bg-white">
                {/* Left Sidebar - Subjects */}
                <aside className="w-64 border-r border-gray-200 hidden md:flex flex-col bg-white sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
                    <div className="p-6 border-b border-gray-100">
                        <button
                            onClick={() => navigate(decodedCourseName ? '/' : `/campus/${campusSlug}`)}
                            className="text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-black transition-colors mb-2 flex items-center gap-1"
                        >
                            <ChevronRight className="w-3 h-3 rotate-180" /> Back
                        </button>
                        <h2 className="text-xl font-bold text-gray-900 truncate">
                            {decodedCourseName || `Semester ${semesterId}`}
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto py-4">
                        <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Subjects
                        </div>
                        <nav className="space-y-1 px-3">
                            <button
                                onClick={() => setSelectedSubject('')}
                                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${!selectedSubject
                                    ? 'bg-brand-50 text-brand-700'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <span>All Subjects</span>
                                <span className="text-xs text-gray-400">{questions.length}</span>
                            </button>
                            {subjects.map((subject) => (
                                <button
                                    key={subject}
                                    onClick={() => setSelectedSubject(subject)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${selectedSubject === subject
                                        ? 'bg-brand-50 text-brand-700'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="truncate">{subject}</span>
                                    <span className="text-xs text-gray-400">{subjectCounts[subject] ?? 0}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 border-r border-gray-200 bg-white">
                    <div className="p-6 md:p-8">
                        {/* Header & Search */}
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-gray-900 mb-6">
                                {selectedSubject ? selectedSubject : 'All Questions'}
                            </h1>
                            <div className="relative max-w-2xl">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search questions by name or topic..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* Questions List */}
                        {filteredQuestions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    No questions found
                                </h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    Be the first to contribute a question here.
                                </p>
                                <button
                                    onClick={() => navigate('/contribute')}
                                    className="bg-black text-white font-medium py-2.5 px-6 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm"
                                >
                                    <Plus className="w-4 h-4" /> Contribute Now
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredQuestions.map((question) => (
                                    <div
                                        key={question.id}
                                        className="bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-300 hover:shadow-sm transition-all"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                                    {question.questionName}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                                    <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
                                                        {question.subject}
                                                    </span>
                                                    <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                                                        {question.topic}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    {question.contributor.picture ? (
                                                        <img
                                                            src={question.contributor.picture}
                                                            alt={question.contributor.name}
                                                            referrerPolicy="no-referrer"
                                                            className="w-5 h-5 rounded-full border border-gray-200"
                                                        />
                                                    ) : (
                                                        <User className="w-5 h-5 p-0.5 bg-gray-100 rounded-full" />
                                                    )}
                                                    <span className="font-medium text-gray-700">{question.contributor.name}</span>
                                                    <span>·</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>
                                            <a
                                                href={question.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="shrink-0 inline-flex items-center justify-center bg-black hover:bg-gray-800 text-white text-sm font-medium py-2 px-5 rounded-lg transition-colors"
                                            >
                                                View <ChevronRight className="w-4 h-4 ml-1" />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                {/* Right Sidebar - Widgets */}
                <aside className="w-80 hidden lg:block bg-gray-50/30 p-6 border-l border-gray-200 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
                    {/* Widget 1: Contribute Action */}
                    <div className="bg-brand-50 border border-brand-100 rounded-xl p-5 mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-brand-800 bg-brand-100 px-2 py-1 rounded">HELP COMMUNITY</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Contribute a Question</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Help your peers by adding new questions to this semester.
                        </p>
                        <button
                            onClick={() => navigate('/contribute')}
                            className="w-full bg-black text-white font-medium py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-sm"
                        >
                            Contribute Now
                        </button>
                    </div>

                    {/* Widget 2: Stats */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <h3 className="font-bold text-gray-900 mb-4">Overview</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                    <BookOpen className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-gray-900">{questions.length}</div>
                                    <div className="text-xs text-gray-500">Total Questions</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                    <Clock className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-gray-900">{subjects.length}</div>
                                    <div className="text-xs text-gray-500">Subjects</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </Layout>
    );
};

export default Questions;
