import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../config/firebase';
import { Trophy, TrendingUp, Award, Star, Loader2, Brain } from 'lucide-react';
import { campusesApi, contributionsApi, questionsApi } from '../services/api';
import AIUploadPopup from '../components/AIUploadPopup';

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
        questionName: '',
        subject: '',
        topic: '',
        link: ''
    });

    const [isCustomCourse, setIsCustomCourse] = useState(false);

    useEffect(() => {
        fetchCampuses();
        fetchLeaderboard();
    }, []);

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

        setLoading(true);
        try {
            // Get Firebase ID token from current user
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) {
                alert('Please login to contribute');
                navigate('/login');
                return;
            }

            const token = await firebaseUser.getIdToken();

            // Check for duplicate question title
            const checkResponse = await questionsApi.getAll({
                campus: formData.campusSlug,
                semester: formData.semester
            });

            if (checkResponse.success) {
                const existingQuestion = checkResponse.questions.find(
                    (q: any) => q.questionName.toLowerCase() === formData.questionName.toLowerCase()
                );

                if (existingQuestion) {
                    alert('⚠️ A question with this title already exists! Please use a different title.');
                    setLoading(false);
                    return;
                }
            }

            const response = await questionsApi.contribute(formData, token);

            if (response.success) {
                setSuccess(true);
                setFormData({
                    campusSlug: '',
                    semester: '',
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

        // If campus is changed, check if it's a custom course
        if (name === 'campusSlug') {
            const selectedCampus = campuses.find(c => c.slug === value);
            const isCustom = selectedCampus?.description?.toLowerCase().includes('custom course') || false;
            setIsCustomCourse(isCustom);

            // If custom course, set semester to "0", otherwise reset to empty
            setFormData({
                ...formData,
                campusSlug: value,
                semester: isCustom ? '0' : ''
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    return (
        <Layout>
            {/* Prize Banner - Professional White/Black Theme */}
            <div className="mb-8 bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-2xl p-8 relative overflow-hidden border border-gray-700 shadow-2xl">
                {/* Subtle geometric patterns */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-48 -mt-48"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-white/5 to-transparent rounded-full -ml-32 -mb-32"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full">
                    <div className="absolute top-0 left-0 w-2 h-2 bg-white/20 rounded-full"></div>
                    <div className="absolute top-10 right-20 w-1 h-1 bg-white/30 rounded-full"></div>
                    <div className="absolute bottom-10 left-20 w-1.5 h-1.5 bg-white/25 rounded-full"></div>
                </div>

                <div className="relative z-10 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <Trophy className="w-16 h-16 text-yellow-400 drop-shadow-lg" />
                            <div className="absolute inset-0 blur-xl bg-yellow-400/30"></div>
                        </div>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                        Win Exciting Prizes
                    </h2>
                    <div className="mb-4">
                        <p className="text-sm text-gray-400 mb-2">Gifts Worth</p>
                        <p className="text-5xl md:text-6xl font-black text-white tracking-tight">
                            ₹5,000
                        </p>
                    </div>
                    <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto mb-4">
                        Contribute questions, help your peers, and climb the leaderboard to win amazing rewards
                    </p>
                    <p className="text-sm text-gray-400 flex justify-center items-center gap-2">
                        Special thanks to{' '}
                        <a
                            href="https://linkedin.com/in/pranav-singh-developer/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 underline font-medium"
                        >
                            Pranav Singh
                        </a>
                        &
                        <a
                            href="https://linkedin.com/in/codernsingh"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 underline font-medium"
                        >
                            Narendra Singh
                        </a>
                        &
                        <a
                            href="https://www.linkedin.com/in/keshavrajput/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 underline font-medium"
                        >
                            Keshav
                        </a>

                        &
                        <a
                            href="https://www.linkedin.com/in/abhijeet-kumar79/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 underline font-medium"
                        >
                            Abhijeet Kumar
                        </a>

                    </p>
                    {/* <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                            <Star className="w-5 h-5 text-yellow-400" />
                            <span className="text-sm text-white font-medium">10 points per question</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                            <Award className="w-5 h-5 text-emerald-400" />
                            <span className="text-sm text-white font-medium">Monthly rewards</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                            <span className="text-sm text-white font-medium">Top 10 winners</span>
                        </div>
                    </div> */}
                    <p className="text-sm text-gray-400">*Terms and Conditions Apply</p>
                </div>
            </div>

            {/* AI Training Contribution Button */}
            <div className="mb-8">
                <button
                    onClick={() => setShowAIUpload(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-6 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3"
                >
                    <Brain className="w-6 h-6" />
                    <span className="text-base">Contribute to AI Model Training</span>
                </button>
                <p className="text-sm text-gray-600 mt-2 text-center">
                    Help us build a smarter learning assistant by uploading course materials
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Contribution Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Contribute a Question
                        </h2>

                        {success && (
                            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                                ✅ Question contributed successfully! You earned 10 points!
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Campus Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Campus *
                                </label>
                                <select
                                    name="campusSlug"
                                    value={formData.campusSlug}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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

                            {/* Semester Selection - Conditional */}
                            {!isCustomCourse ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Semester *
                                    </label>
                                    <select
                                        name="semester"
                                        value={formData.semester}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Semester
                                    </label>
                                    <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50">
                                        <span className="text-purple-700 font-medium flex items-center gap-2">
                                            🎯 No Semester (default) - Custom Course
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        This campus uses a custom course structure without semesters
                                    </p>
                                </div>
                            )}

                            {/* Question Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Question Title *
                                </label>
                                <input
                                    type="text"
                                    name="questionName"
                                    value={formData.questionName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="e.g., Data Structures Assignment 1"
                                    required
                                />
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject *
                                </label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="e.g., Data Structures"
                                    required
                                />
                            </div>

                            {/* Topic */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Topic *
                                </label>
                                <input
                                    type="text"
                                    name="topic"
                                    value={formData.topic}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="e.g., Arrays and Linked Lists"
                                    required
                                />
                            </div>

                            {/* Link */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Link to Question *
                                </label>
                                <input
                                    type="url"
                                    name="link"
                                    value={formData.link}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                                    readOnly
                                    disabled
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Your email will be shown as the contributor
                                </p>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                    <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            Top Contributors
                        </h3>

                        <div className="space-y-3">
                            {leaderboard.map((entry) => (
                                <div
                                    key={entry.rank}
                                    className={`flex items-center gap-3 p-3 rounded-lg ${entry.rank <= 3
                                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200'
                                        : 'bg-gray-50'
                                        }`}
                                >
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${entry.rank === 1 ? 'bg-yellow-400 text-white' :
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
                                            className="w-10 h-10 rounded-full"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-emerald-700 font-semibold">
                                            {entry.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">
                                            {entry.name}
                                        </p>
                                        <p className="text-sm text-gray-600">
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
