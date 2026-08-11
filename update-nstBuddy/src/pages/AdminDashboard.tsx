import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../config/firebase';
import { Plus, Edit, Trash2, LogOut, Users, TrendingUp, BookOpen, MapPin, Filter } from 'lucide-react';
import { campusesApi, contributionsApi, questionsApi } from '../services/api';

interface Campus {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string;
    questionCount: number;
}

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
    isApproved: boolean;
    createdAt: string;
}

interface LeaderboardEntry {
    rank: number;
    name: string;
    email: string;
    picture?: string;
    contributionCount: number;
    contributionPoints: number;
}

const AdminDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // State
    const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'leaderboard'>('overview');
    const [campuses, setCampuses] = useState<Campus[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [selectedCampus, setSelectedCampus] = useState<string>('');
    const [selectedSemester, setSelectedSemester] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [subjects, setSubjects] = useState<string[]>([]);

    // Form states
    const [showQuestionForm, setShowQuestionForm] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [questionForm, setQuestionForm] = useState({
        campusSlug: '',
        semester: '',
        questionName: '',
        subject: '',
        topic: '',
        link: ''
    });

    // Stats
    const [stats, setStats] = useState({
        totalQuestions: 0,
        totalContributors: 0,
        totalCampuses: 0
    });

    useEffect(() => {
        fetchCampuses();
        fetchLeaderboard();
    }, []);

    useEffect(() => {
        if (activeTab === 'questions') {
            fetchQuestions();
            fetchFilters();
        }
    }, [activeTab, selectedCampus, selectedSemester, selectedSubject]);

    const fetchCampuses = async () => {
        try {
            const response = await campusesApi.getAll();
            if (response.success) {
                setCampuses(response.campuses);
                setStats(prev => ({
                    ...prev,
                    totalCampuses: response.campuses.length,
                    totalQuestions: response.campuses.reduce((sum: number, c: Campus) => sum + c.questionCount, 0)
                }));
            }
        } catch (error) {
            // Error fetching campuses silently
        }
    };

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (selectedCampus) params.campus = selectedCampus;
            if (selectedSemester) params.semester = selectedSemester;
            if (selectedSubject) params.subject = selectedSubject;

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
            const params: any = {};
            if (selectedCampus) params.campus = selectedCampus;
            if (selectedSemester) params.semester = selectedSemester;

            const response = await questionsApi.getFilters(params);
            if (response.success) {
                setSubjects(response.subjects);
            }
        } catch (error) {
            // Error fetching filters silently
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const response = await contributionsApi.getLeaderboard(20);
            if (response.success) {
                setLeaderboard(response.leaderboard);
                setStats(prev => ({
                    ...prev,
                    totalContributors: response.leaderboard.length
                }));
            }
        } catch (error) {
            // Error fetching leaderboard silently
        }
    };

    const handleQuestionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;

            const token = await firebaseUser.getIdToken();

            if (editingQuestion) {
                await questionsApi.update(editingQuestion.id, questionForm, token);
            } else {
                await questionsApi.create(questionForm, token);
            }

            setShowQuestionForm(false);
            setEditingQuestion(null);
            setQuestionForm({
                campusSlug: '',
                semester: '',
                questionName: '',
                subject: '',
                topic: '',
                link: ''
            });
            fetchQuestions();
            fetchCampuses();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to save question');
        }
    };

    const handleDeleteQuestion = async (id: string) => {
        if (!confirm('Are you sure you want to delete this question?')) return;

        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;

            const token = await firebaseUser.getIdToken();
            await questionsApi.delete(id, token);

            fetchQuestions();
            fetchCampuses();
        } catch (error) {
            alert('Failed to delete question');
        }
    };

    const startEditQuestion = (question: Question) => {
        setEditingQuestion(question);
        setQuestionForm({
            campusSlug: question.campus.slug,
            semester: question.semester.toString(),
            questionName: question.questionName,
            subject: question.subject,
            topic: question.topic,
            link: question.link
        });
        setShowQuestionForm(true);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <Layout>
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-black">Admin Dashboard</h1>
                    <p className="text-gray-600 mt-1 text-lg">NST Buddy 2.0 - Multi-Campus Management</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-gray-900 text-white rounded-lg transition-colors font-medium"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'overview'
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('questions')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'questions'
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Questions
                </button>
                <button
                    onClick={() => setActiveTab('leaderboard')}
                    className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'leaderboard'
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    Contributors
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-emerald-500 to-pink-500 rounded-xl p-6 text-white">
                            <div className="flex items-center justify-between mb-4">
                                <BookOpen className="w-8 h-8" />
                                <span className="text-3xl font-bold">{stats.totalQuestions}</span>
                            </div>
                            <h3 className="text-lg font-semibold">Total Questions</h3>
                            <p className="text-sm opacity-90">Across all campuses</p>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl p-6 text-white">
                            <div className="flex items-center justify-between mb-4">
                                <MapPin className="w-8 h-8" />
                                <span className="text-3xl font-bold">{stats.totalCampuses}</span>
                            </div>
                            <h3 className="text-lg font-semibold">Active Campuses</h3>
                            <p className="text-sm opacity-90">Delhi NCR, Pune, Bangalore</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-6 text-white">
                            <div className="flex items-center justify-between mb-4">
                                <TrendingUp className="w-8 h-8" />
                                <span className="text-3xl font-bold">{stats.totalContributors}</span>
                            </div>
                            <h3 className="text-lg font-semibold">Contributors</h3>
                            <p className="text-sm opacity-90">Active contributors</p>
                        </div>
                    </div>

                    {/* Campus Cards */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Campus Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {campuses.map((campus) => (
                            <div key={campus.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                                {/* Campus Image */}
                                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                    {campus.imageUrl ? (
                                        <img
                                            src={campus.imageUrl}
                                            alt={campus.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-50"></div>
                                    )}
                                </div>

                                {/* Campus Info */}
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold text-gray-900">
                                            Newton School of Technology'{campus.name.includes('24') ? campus.name.split("'")[1] : '24'}
                                        </h3>
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                            <MapPin className="w-5 h-5 text-gray-600" />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                            Enrolled
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-emerald-600 mb-4">
                                        <BookOpen className="w-5 h-5" />
                                        <span className="text-2xl font-bold">{campus.questionCount}</span>
                                        <span className="text-gray-600">questions</span>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setSelectedCampus(campus.slug);
                                            setActiveTab('questions');
                                        }}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        Continue Learning
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Questions Tab */}
            {activeTab === 'questions' && (
                <div>
                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter className="w-5 h-5 text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Campus</label>
                                <select
                                    value={selectedCampus}
                                    onChange={(e) => setSelectedCampus(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">All Campuses</option>
                                    {campuses.map((campus) => (
                                        <option key={campus.id} value={campus.slug}>
                                            {campus.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                                <select
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">All Semesters</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                        <option key={sem} value={sem}>
                                            Semester {sem}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">All Subjects</option>
                                    {subjects.map((subject) => (
                                        <option key={subject} value={subject}>
                                            {subject}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        setSelectedCampus('');
                                        setSelectedSemester('');
                                        setSelectedSubject('');
                                    }}
                                    className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Add Question Button */}
                    <div className="mb-6">
                        <button
                            onClick={() => {
                                setShowQuestionForm(!showQuestionForm);
                                setEditingQuestion(null);
                                setQuestionForm({
                                    campusSlug: '',
                                    semester: '',
                                    questionName: '',
                                    subject: '',
                                    topic: '',
                                    link: ''
                                });
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Question
                        </button>
                    </div>

                    {/* Question Form */}
                    {showQuestionForm && (
                        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                            <h2 className="text-xl font-bold mb-4">
                                {editingQuestion ? 'Edit Question' : 'Add New Question'}
                            </h2>
                            <form onSubmit={handleQuestionSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Campus *</label>
                                        <select
                                            value={questionForm.campusSlug}
                                            onChange={(e) => setQuestionForm({ ...questionForm, campusSlug: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            required
                                        >
                                            <option value="">Select Campus</option>
                                            {campuses.map((campus) => (
                                                <option key={campus.id} value={campus.slug}>
                                                    {campus.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Semester *</label>
                                        <select
                                            value={questionForm.semester}
                                            onChange={(e) => setQuestionForm({ ...questionForm, semester: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            required
                                        >
                                            <option value="">Select Semester</option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                                <option key={sem} value={sem}>
                                                    Semester {sem}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Question Title *</label>
                                    <input
                                        type="text"
                                        value={questionForm.questionName}
                                        onChange={(e) => setQuestionForm({ ...questionForm, questionName: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                                        <input
                                            type="text"
                                            value={questionForm.subject}
                                            onChange={(e) => setQuestionForm({ ...questionForm, subject: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Topic *</label>
                                        <input
                                            type="text"
                                            value={questionForm.topic}
                                            onChange={(e) => setQuestionForm({ ...questionForm, topic: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Link *</label>
                                    <input
                                        type="url"
                                        value={questionForm.link}
                                        onChange={(e) => setQuestionForm({ ...questionForm, link: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        placeholder="https://..."
                                        required
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                                    >
                                        {editingQuestion ? 'Update' : 'Add'} Question
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowQuestionForm(false);
                                            setEditingQuestion(null);
                                        }}
                                        className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Questions List */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No questions found</h3>
                            <p className="text-gray-600">Try adjusting your filters or add a new question</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campus</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contributor</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {questions.map((question) => (
                                        <tr key={question.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{question.questionName}</div>
                                                <div className="text-xs text-gray-500">{question.topic}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{question.campus.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">Sem {question.semester}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{question.subject}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {question.contributor.picture ? (
                                                        <img
                                                            src={question.contributor.picture}
                                                            alt={question.contributor.name}
                                                            className="w-6 h-6 rounded-full"
                                                        />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center text-emerald-700 text-xs font-semibold">
                                                            {question.contributor.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div className="text-sm">
                                                        <div className="font-medium text-gray-900">{question.contributor.name}</div>
                                                        <div className="text-xs text-gray-500">{question.contributor.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => startEditQuestion(question)}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteQuestion(question.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
                <div>
                    <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-6">
                        <h2 className="text-2xl font-bold text-black mb-6">Top Contributors</h2>
                        <div className="space-y-4">
                            {leaderboard.map((entry) => (
                                <div
                                    key={entry.rank}
                                    className={`flex items-center gap-4 p-4 rounded-lg ${entry.rank <= 3
                                        ? 'bg-black text-white border-2 border-gray-800'
                                        : 'bg-gray-50 border-2 border-gray-200'
                                        }`}
                                >
                                    <div
                                        className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${entry.rank === 1
                                            ? 'bg-yellow-400 text-black'
                                            : entry.rank === 2
                                                ? 'bg-gray-300 text-black'
                                                : entry.rank === 3
                                                    ? 'bg-white text-black border-2 border-gray-300'
                                                    : 'bg-gray-200 text-gray-600'
                                            }`}
                                    >
                                        {entry.rank}
                                    </div>
                                    {entry.picture ? (
                                        <img
                                            src={entry.picture}
                                            alt={entry.name}
                                            className="w-12 h-12 rounded-full"
                                        />
                                    ) : (
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg ${entry.rank <= 3 ? 'bg-white text-black' : 'bg-gray-200 text-black'
                                            }`}>
                                            {entry.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <p className={`font-bold ${entry.rank <= 3 ? 'text-white' : 'text-black'}`}>
                                            {entry.name}
                                        </p>
                                        <p className={`text-sm ${entry.rank <= 3 ? 'text-gray-300' : 'text-gray-600'}`}>
                                            {entry.email}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-2xl font-bold ${entry.rank <= 3 ? 'text-yellow-400' : 'text-black'}`}>
                                            {entry.contributionPoints}
                                        </p>
                                        <p className={`text-sm ${entry.rank <= 3 ? 'text-gray-300' : 'text-gray-600'}`}>
                                            {entry.contributionCount} questions
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default AdminDashboard;
