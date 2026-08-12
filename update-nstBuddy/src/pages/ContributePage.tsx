import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../config/firebase';
import { Trophy, Loader2, Brain, GraduationCap, Sparkles, Link2, BookOpen, Tag, Layers } from 'lucide-react';
import { campusesApi, contributionsApi, questionsApi } from '../services/api';
import AIUploadPopup from '../components/AIUploadPopup';

type ContributeMode = 'college' | 'others';

interface Campus {
    id: string;
    name: string;
    slug: string;
    description?: string;
}

interface LeaderboardEntry {
    rank: number;
    name: string;
    picture?: string;
    contributionCount: number;
    contributionPoints: number;
}

const ContributePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [campuses, setCampuses] = useState<Campus[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showAIUpload, setShowAIUpload] = useState(false);

    const [formData, setFormData] = useState({
        campusSlug: '',
        semester: '',
        customCourse: '',
        questionName: '',
        subject: '',
        topic: '',
        link: ''
    });

    const [mode, setMode] = useState<ContributeMode>('college');
    const [courseOptions, setCourseOptions] = useState<string[]>([]);
    const [subjectOptions, setSubjectOptions] = useState<string[]>([]);

    useEffect(() => {
        fetchCampuses();
        fetchLeaderboard();
        fetchCourseOptions();
        fetchSubjectOptions();
    }, []);

    const fetchSubjectOptions = async () => {
        try {
            const response = await questionsApi.getSubjects();
            if (response.success) setSubjectOptions(response.subjects);
        } catch (error) {
            // Error fetching subjects silently
        }
    };

    const fetchCampuses = async () => {
        try {
            const response = await campusesApi.getAll();
            if (response.success) {
                setCampuses(response.campuses);
            }
        } catch (error) {
            // Error fetching campuses silently
        }
    };

    const fetchCourseOptions = async () => {
        try {
            const response = await questionsApi.getCourseOptions();
            if (response.success) setCourseOptions(response.courses);
        } catch (error) {
            // Error fetching course options silently
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const response = await contributionsApi.getLeaderboard(10);
            if (response.success) {
                setLeaderboard(response.leaderboard);
            }
        } catch (error) {
            // Error fetching leaderboard silently
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert('Please login to contribute');
            navigate('/login');
            return;
        }

        if (mode === 'others' && !formData.customCourse) {
            alert('Please select a course');
            return;
        }

        setLoading(true);
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) {
                alert('Please login to contribute');
                navigate('/login');
                return;
            }

            const token = await firebaseUser.getIdToken();

            // Check for duplicate question title within the same scope
            const checkResponse = await questionsApi.getAll(
                mode === 'others'
                    ? { customCourse: formData.customCourse }
                    : { campus: formData.campusSlug, semester: formData.semester }
            );

            if (checkResponse.success) {
                const existingQuestion = checkResponse.questions.find(
                    (q: any) => q.questionName.toLowerCase() === formData.questionName.toLowerCase()
                );

                if (existingQuestion) {
                    alert('A question with this title already exists! Please use a different title.');
                    setLoading(false);
                    return;
                }
            }

            const payload = mode === 'others'
                ? { customCourse: formData.customCourse, questionName: formData.questionName, subject: formData.subject, topic: formData.topic, link: formData.link }
                : { campusSlug: formData.campusSlug, semester: formData.semester, questionName: formData.questionName, subject: formData.subject, topic: formData.topic, link: formData.link };

            const response = await questionsApi.contribute(payload, token);

            if (response.success) {
                setSuccess(true);
                setFormData({
                    campusSlug: '',
                    semester: '',
                    customCourse: '',
                    questionName: '',
                    subject: '',
                    topic: '',
                    link: ''
                });
                fetchLeaderboard(); // Refresh leaderboard
                setTimeout(() => setSuccess(false), 5000);
            }
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to contribute question');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    return (
        <Layout>
            {/* Reward banner */}
            <div className="mb-8 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24" />
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                        <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white mb-1">Win Prizes Worth ₹5,000</h2>
                        <p className="text-white/70 text-sm">
                            Every contribution earns 10 points. Climb the leaderboard and help your peers along the way.
                        </p>
                    </div>
                    <p className="text-xs text-white/50 shrink-0">*Terms and Conditions Apply</p>
                </div>
            </div>

            {/* AI Training Contribution Button */}
            <div className="mb-8">
                <button
                    onClick={() => setShowAIUpload(true)}
                    className="w-full bg-white border border-gray-200 hover:border-brand-300 text-gray-800 font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3"
                >
                    <Brain className="w-5 h-5 text-brand-600" />
                    <span className="text-base">Contribute to AI Model Training</span>
                </button>
                <p className="text-sm text-gray-500 mt-2 text-center">
                    Help us build a smarter learning assistant by uploading course materials
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Contribution Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">
                            Contribute a Question
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">Add a question and help other students find it later.</p>

                        {success && (
                            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm font-medium">
                                Question contributed successfully! You earned 10 points!
                            </div>
                        )}

                        {/* College / Others mode switch */}
                        <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1 mb-6 w-fit">
                            <button
                                type="button"
                                onClick={() => setMode('college')}
                                className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
                                    mode === 'college' ? 'bg-white shadow-sm text-brand-700' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <GraduationCap className="w-4 h-4" /> College
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('others')}
                                className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
                                    mode === 'others' ? 'bg-white shadow-sm text-brand-700' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Sparkles className="w-4 h-4" /> Others
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {mode === 'college' ? (
                                <div className="grid sm:grid-cols-2 gap-5">
                                    {/* Campus Selection */}
                                    <div>
                                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                                            <GraduationCap className="w-3.5 h-3.5 text-gray-400" /> Campus *
                                        </label>
                                        <select
                                            name="campusSlug"
                                            value={formData.campusSlug}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50"
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

                                    {/* Semester Selection */}
                                    <div>
                                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                                            <Layers className="w-3.5 h-3.5 text-gray-400" /> Semester *
                                        </label>
                                        <select
                                            name="semester"
                                            value={formData.semester}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50"
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
                            ) : (
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                                        <Sparkles className="w-3.5 h-3.5 text-gray-400" /> Course *
                                    </label>
                                    {courseOptions.length === 0 ? (
                                        <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                                            No courses are open yet - ask an admin to add one from the admin dashboard.
                                        </p>
                                    ) : (
                                        <select
                                            name="customCourse"
                                            value={formData.customCourse}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50"
                                            required
                                        >
                                            <option value="">Select a course</option>
                                            {courseOptions.map((course) => (
                                                <option key={course} value={course}>
                                                    {course}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1.5">
                                        No semester needed - questions are grouped by course instead.
                                    </p>
                                </div>
                            )}

                            {/* Question Name */}
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                                    <BookOpen className="w-3.5 h-3.5 text-gray-400" /> Question Title *
                                </label>
                                <input
                                    type="text"
                                    name="questionName"
                                    value={formData.questionName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50"
                                    placeholder="e.g., Data Structures Assignment 1"
                                    required
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-5">
                                {/* Subject */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                                        <Tag className="w-3.5 h-3.5 text-gray-400" /> Subject *
                                    </label>
                                    <input
                                        type="text"
                                        name="subject"
                                        list="existing-subjects"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50"
                                        placeholder="e.g., Data Structures"
                                        required
                                    />
                                    <datalist id="existing-subjects">
                                        {subjectOptions.map((s) => (
                                            <option key={s} value={s} />
                                        ))}
                                    </datalist>
                                    <p className="text-[11px] text-gray-400 mt-1.5">
                                        Pick an existing subject if it's already there to avoid duplicates.
                                    </p>
                                </div>

                                {/* Topic */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                                        <Tag className="w-3.5 h-3.5 text-gray-400" /> Topic *
                                    </label>
                                    <input
                                        type="text"
                                        name="topic"
                                        value={formData.topic}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50"
                                        placeholder="e.g., Arrays and Linked Lists"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Link */}
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                                    <Link2 className="w-3.5 h-3.5 text-gray-400" /> Link to Question *
                                </label>
                                <input
                                    type="url"
                                    name="link"
                                    value={formData.link}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50"
                                    placeholder="https://..."
                                    required
                                />
                            </div>

                            {/* Contributor Email (Read-only) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Email
                                </label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                                    readOnly
                                    disabled
                                />
                                <p className="text-xs text-gray-400 mt-1.5">
                                    Your email will be shown as the contributor
                                </p>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Checking & Submitting...</span>
                                    </>
                                ) : (
                                    'Contribute Question'
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="lg:col-span-1">
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sticky top-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            Top Contributors
                        </h3>

                        <div className="space-y-3">
                            {leaderboard.map((entry) => (
                                <div
                                    key={entry.rank}
                                    className={`flex items-center gap-3 p-3 rounded-xl ${entry.rank <= 3
                                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200'
                                        : 'bg-gray-50'
                                        }`}
                                >
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${entry.rank === 1 ? 'bg-yellow-400 text-white' :
                                        entry.rank === 2 ? 'bg-gray-300 text-white' :
                                            entry.rank === 3 ? 'bg-orange-400 text-white' :
                                                'bg-gray-200 text-gray-600'
                                        }`}>
                                        {entry.rank}
                                    </div>
                                    {entry.picture ? (
                                        <img
                                            src={entry.picture}
                                            alt={entry.name}
                                            referrerPolicy="no-referrer"
                                            className="w-9 h-9 rounded-full"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm">
                                            {entry.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm truncate">
                                            {entry.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {entry.contributionPoints} points
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Upload Popup */}
            <AIUploadPopup
                isOpen={showAIUpload}
                onClose={() => setShowAIUpload(false)}
            />
        </Layout>
    );
};

export default ContributePage;
