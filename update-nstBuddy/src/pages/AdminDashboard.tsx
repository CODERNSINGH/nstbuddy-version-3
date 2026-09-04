import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../config/firebase';
import { Plus, Edit, Trash2, LogOut, Users, TrendingUp, BookOpen, MapPin, Filter, ShieldBan, ShieldCheck, MessageSquare, Search, GraduationCap, Loader2, Megaphone, Eye, EyeOff } from 'lucide-react';
import { campusesApi, contributionsApi, questionsApi, communityApi, adminApi, announcementsApi, AdminUser, AdminCourse, CommunityPost } from '../services/api';
import { Announcement } from '../types';
import PostCard from '../components/community/PostCard';
import BannerPicker from '../components/groups/BannerPicker';

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
    semester: number | null;
    campus: {
        name: string;
        slug: string;
    } | null;
    customCourse: string | null;
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
    const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'leaderboard' | 'users' | 'community' | 'courses' | 'announcements'>('overview');
    const [campuses, setCampuses] = useState<Campus[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);

    // Master control: all users + all community posts
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [banBusyEmail, setBanBusyEmail] = useState<string | null>(null);
    const [allPosts, setAllPosts] = useState<CommunityPost[]>([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [courses, setCourses] = useState<AdminCourse[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [newCourseName, setNewCourseName] = useState('');
    const [newCourseDescription, setNewCourseDescription] = useState('');
    const [newCourseImage, setNewCourseImage] = useState<string | null>(null);
    const [courseSubmitting, setCourseSubmitting] = useState(false);
    const [courseError, setCourseError] = useState('');
    const [adminToken, setAdminToken] = useState<string | null>(null);

    // Announcements - horizontal rail shown on the main page
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [announcementsLoading, setAnnouncementsLoading] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [announcementTitle, setAnnouncementTitle] = useState('');
    const [announcementDescription, setAnnouncementDescription] = useState('');
    const [announcementImage, setAnnouncementImage] = useState<string | null>(null);
    const [announcementLink, setAnnouncementLink] = useState('');
    const [announcementDeadline, setAnnouncementDeadline] = useState(''); // datetime-local string, e.g. "2026-09-20T18:30"
    const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);
    const [announcementError, setAnnouncementError] = useState('');
    const [announcementBusyId, setAnnouncementBusyId] = useState<string | null>(null);

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
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'community') fetchAllPosts();
        if (activeTab === 'courses') fetchCourses();
        if (activeTab === 'announcements') fetchAnnouncements();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, selectedCampus, selectedSemester, selectedSubject]);

    const fetchAnnouncements = async () => {
        setAnnouncementsLoading(true);
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();
            setAdminToken(token);
            const response = await announcementsApi.getAll(token);
            if (response.success) setAnnouncements(response.announcements);
        } catch (error) {
            // Error fetching announcements silently
        } finally {
            setAnnouncementsLoading(false);
        }
    };

    const resetAnnouncementForm = () => {
        setEditingAnnouncement(null);
        setAnnouncementTitle('');
        setAnnouncementDescription('');
        setAnnouncementImage(null);
        setAnnouncementLink('');
        setAnnouncementDeadline('');
        setAnnouncementError('');
    };

    // datetime-local inputs want "YYYY-MM-DDTHH:mm" in the viewer's local time, not a UTC ISO string
    const toDatetimeLocal = (iso: string) => {
        const date = new Date(iso);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const startEditAnnouncement = (announcement: Announcement) => {
        setEditingAnnouncement(announcement);
        setAnnouncementTitle(announcement.title);
        setAnnouncementDescription(announcement.description);
        setAnnouncementImage(announcement.imageUrl || null);
        setAnnouncementLink(announcement.link || '');
        setAnnouncementDeadline(announcement.deadline ? toDatetimeLocal(announcement.deadline) : '');
        setAnnouncementError('');
    };

    const handleAnnouncementSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!announcementTitle.trim() || !announcementDescription.trim() || announcementSubmitting) return;
        setAnnouncementSubmitting(true);
        setAnnouncementError('');
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();
            const data = {
                title: announcementTitle.trim(),
                description: announcementDescription.trim(),
                imageUrl: announcementImage,
                link: announcementLink.trim() || null,
                deadline: announcementDeadline ? new Date(announcementDeadline).toISOString() : null,
            };

            if (editingAnnouncement) {
                const response = await announcementsApi.update(editingAnnouncement.id, data, token);
                if (response.success) {
                    setAnnouncements((prev) => prev.map((a) => (a.id === editingAnnouncement.id ? response.announcement : a)));
                    resetAnnouncementForm();
                } else {
                    setAnnouncementError(response.error || 'Failed to update announcement');
                }
            } else {
                const response = await announcementsApi.create(data, token);
                if (response.success) {
                    setAnnouncements((prev) => [response.announcement, ...prev]);
                    resetAnnouncementForm();
                } else {
                    setAnnouncementError(response.error || 'Failed to create announcement');
                }
            }
        } catch (error: any) {
            setAnnouncementError(error.response?.data?.error || 'Failed to save announcement');
        } finally {
            setAnnouncementSubmitting(false);
        }
    };

    const handleToggleAnnouncementActive = async (announcement: Announcement) => {
        setAnnouncementBusyId(announcement.id);
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();
            const response = await announcementsApi.update(announcement.id, { isActive: !announcement.isActive }, token);
            if (response.success) {
                setAnnouncements((prev) => prev.map((a) => (a.id === announcement.id ? response.announcement : a)));
            }
        } catch (error) {
            alert('Failed to update announcement');
        } finally {
            setAnnouncementBusyId(null);
        }
    };

    const handleDeleteAnnouncement = async (announcement: Announcement) => {
        if (!confirm(`Delete the announcement "${announcement.title}"?`)) return;
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();
            const response = await announcementsApi.delete(announcement.id, token);
            if (response.success) {
                setAnnouncements((prev) => prev.filter((a) => a.id !== announcement.id));
                if (editingAnnouncement?.id === announcement.id) resetAnnouncementForm();
            }
        } catch (error) {
            alert('Failed to delete announcement');
        }
    };

    const fetchCourses = async () => {
        setCoursesLoading(true);
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();
            setAdminToken(token);
            const response = await adminApi.getCustomCourses(token);
            if (response.success) setCourses(response.courses);
        } catch (error) {
            // Error fetching courses silently
        } finally {
            setCoursesLoading(false);
        }
    };

    const handleAddCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCourseName.trim() || courseSubmitting) return;
        setCourseSubmitting(true);
        setCourseError('');
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();
            const response = await adminApi.createCustomCourse(
                { name: newCourseName.trim(), description: newCourseDescription.trim() || undefined, imageUrl: newCourseImage || undefined },
                token
            );
            if (response.success) {
                setCourses((prev) => [...prev, { ...response.course, questionCount: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
                setNewCourseName('');
                setNewCourseDescription('');
                setNewCourseImage(null);
            } else {
                setCourseError(response.error || 'Failed to add course');
            }
        } catch (error: any) {
            setCourseError(error.response?.data?.error || 'Failed to add course');
        } finally {
            setCourseSubmitting(false);
        }
    };

    const handleDeleteCourse = async (course: AdminCourse) => {
        if (!confirm(`Remove "${course.name}" from the course picker? Existing questions keep their tag.`)) return;
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();
            const response = await adminApi.deleteCustomCourse(course.id, token);
            if (response.success) setCourses((prev) => prev.filter((c) => c.id !== course.id));
        } catch (error) {
            alert('Failed to delete course');
        }
    };

    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();
            const response = await adminApi.getUsers(token);
            if (response.success) setUsers(response.users);
        } catch (error) {
            // Error fetching users silently
        } finally {
            setUsersLoading(false);
        }
    };

    const handleToggleBan = async (targetUser: AdminUser) => {
        setBanBusyEmail(targetUser.email);
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();
            const response = await adminApi.setBanned(targetUser.email, !targetUser.isBanned, token);
            if (response.success) {
                setUsers((prev) => prev.map((u) => (u.email === targetUser.email ? { ...u, isBanned: response.isBanned } : u)));
            }
        } catch (error) {
            alert('Failed to update user');
        } finally {
            setBanBusyEmail(null);
        }
    };

    const fetchAllPosts = async () => {
        setPostsLoading(true);
        try {
            const firebaseUser = auth.currentUser;
            const token = firebaseUser ? await firebaseUser.getIdToken() : undefined;
            const response = await communityApi.getPosts(token, { limit: 100 });
            if (response.success) setAllPosts(response.posts);
        } catch (error) {
            // Error fetching posts silently
        } finally {
            setPostsLoading(false);
        }
    };

    const handleAdminPostUpdated = (updated: CommunityPost) => {
        setAllPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    };

    const handleAdminPostDeleted = (id: string) => {
        setAllPosts((prev) => prev.filter((p) => p.id !== id));
    };

    const filteredUsers = users.filter((u) => {
        const q = userSearch.trim().toLowerCase();
        if (!q) return true;
        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });

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
        if (!question.campus) {
            alert('This question belongs to a custom course and cannot be edited from this form yet.');
            return;
        }
        setEditingQuestion(question);
        setQuestionForm({
            campusSlug: question.campus.slug,
            semester: question.semester!.toString(),
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
                        ? 'text-brand-600 border-b-2 border-brand-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('questions')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'questions'
                        ? 'text-brand-600 border-b-2 border-brand-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Questions
                </button>
                <button
                    onClick={() => setActiveTab('leaderboard')}
                    className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'leaderboard'
                        ? 'text-brand-600 border-b-2 border-brand-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    Contributors
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'users'
                        ? 'text-brand-600 border-b-2 border-brand-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <ShieldCheck className="w-4 h-4" />
                    Users
                </button>
                <button
                    onClick={() => setActiveTab('community')}
                    className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'community'
                        ? 'text-brand-600 border-b-2 border-brand-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <MessageSquare className="w-4 h-4" />
                    Community
                </button>
                <button
                    onClick={() => setActiveTab('courses')}
                    className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'courses'
                        ? 'text-brand-600 border-b-2 border-brand-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <GraduationCap className="w-4 h-4" />
                    Courses
                </button>
                <button
                    onClick={() => setActiveTab('announcements')}
                    className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'announcements'
                        ? 'text-brand-600 border-b-2 border-brand-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Megaphone className="w-4 h-4" />
                    Announcements
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-brand-500 to-pink-500 rounded-xl p-6 text-white">
                            <div className="flex items-center justify-between mb-4">
                                <BookOpen className="w-8 h-8" />
                                <span className="text-3xl font-bold">{stats.totalQuestions}</span>
                            </div>
                            <h3 className="text-lg font-semibold">Total Questions</h3>
                            <p className="text-sm opacity-90">Across all campuses</p>
                        </div>

                        <div className="bg-gradient-to-br from-brand-500 to-cyan-500 rounded-xl p-6 text-white">
                            <div className="flex items-center justify-between mb-4">
                                <MapPin className="w-8 h-8" />
                                <span className="text-3xl font-bold">{stats.totalCampuses}</span>
                            </div>
                            <h3 className="text-lg font-semibold">Active Campuses</h3>
                            <p className="text-sm opacity-90">Delhi NCR, Pune, Bangalore</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-brand-500 rounded-xl p-6 text-white">
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

                                    <div className="flex items-center gap-2 text-brand-600 mb-4">
                                        <BookOpen className="w-5 h-5" />
                                        <span className="text-2xl font-bold">{campus.questionCount}</span>
                                        <span className="text-gray-600">questions</span>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setSelectedCampus(campus.slug);
                                            setActiveTab('questions');
                                        }}
                                        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
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
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
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
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
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
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
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
                            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
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
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
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
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
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
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
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
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Topic *</label>
                                        <input
                                            type="text"
                                            value={questionForm.topic}
                                            onChange={(e) => setQuestionForm({ ...questionForm, topic: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
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
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                                        placeholder="https://..."
                                        required
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
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
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
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
                                            <td className="px-6 py-4 text-sm text-gray-600">{question.campus?.name ?? question.customCourse}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{question.semester != null ? `Sem ${question.semester}` : '—'}</td>
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
                                                        <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center text-brand-700 text-xs font-semibold">
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
                                                        className="p-2 text-brand-600 hover:bg-brand-50 rounded"
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

            {/* Users Tab - master control: view everyone, ban/unban from posting */}
            {activeTab === 'users' && (
                <div>
                    <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">All Users</h2>
                            <p className="text-gray-500 text-sm mt-1">{users.length} registered users</p>
                        </div>
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                placeholder="Search by name or email…"
                                className="bg-gray-50 border border-gray-200 rounded-full py-2 pl-9 pr-4 text-sm w-64 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                            />
                        </div>
                    </div>

                    {usersLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {u.picture ? (
                                                        <img src={u.picture} alt={u.name} referrerPolicy="no-referrer" className="w-8 h-8 rounded-full" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-semibold">
                                                            {u.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div className="text-sm">
                                                        <div className="font-medium text-gray-900">{u.name}</div>
                                                        <div className="text-xs text-gray-500">{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {u.isAdmin && (
                                                    <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">Admin</span>
                                                )}
                                                {u.isPro && (
                                                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full ml-1">Pro</span>
                                                )}
                                                {!u.isAdmin && !u.isPro && <span className="text-xs text-gray-400">Member</span>}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {u.contributionCount} questions · {u.postCount} posts · {u.commentCount} replies
                                            </td>
                                            <td className="px-6 py-4">
                                                {u.isBanned ? (
                                                    <span className="flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-full w-fit">
                                                        <ShieldBan className="w-3 h-3" /> Banned
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">Active</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {u.isAdmin ? (
                                                    <span className="text-xs text-gray-300">—</span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleToggleBan(u)}
                                                        disabled={banBusyEmail === u.email}
                                                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                                                            u.isBanned
                                                                ? 'text-brand-700 bg-brand-50 hover:bg-brand-100'
                                                                : 'text-red-600 bg-red-50 hover:bg-red-100'
                                                        }`}
                                                    >
                                                        {u.isBanned ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldBan className="w-3.5 h-3.5" />}
                                                        {u.isBanned ? 'Unban' : 'Ban from posting'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Community Tab - master control: view/edit/delete any post */}
            {activeTab === 'community' && (
                <div>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">All Community Posts</h2>
                        <p className="text-gray-500 text-sm mt-1">
                            {allPosts.length} posts · as admin you can edit or delete any of these
                        </p>
                    </div>

                    {postsLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
                        </div>
                    ) : allPosts.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No posts yet</h3>
                        </div>
                    ) : (
                        <div className="max-w-2xl space-y-4">
                            {allPosts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    onUpdated={handleAdminPostUpdated}
                                    onDeleted={handleAdminPostDeleted}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Courses Tab - only admins can add courses; students pick from this list */}
            {activeTab === 'courses' && (
                <div>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Custom Courses</h2>
                        <p className="text-gray-500 text-sm mt-1">
                            Courses students can pick from the "Others" tab when contributing. Only admins can add new ones.
                        </p>
                    </div>

                    <form onSubmit={handleAddCourse} className="max-w-lg mb-8 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
                        <BannerPicker idToken={adminToken} bannerUrl={newCourseImage} onChange={setNewCourseImage} />

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Course name</label>
                            <input
                                value={newCourseName}
                                onChange={(e) => setNewCourseName(e.target.value.slice(0, 80))}
                                placeholder="e.g., UI/UX Design Bootcamp"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description (optional)</label>
                            <textarea
                                value={newCourseDescription}
                                onChange={(e) => setNewCourseDescription(e.target.value.slice(0, 500))}
                                rows={2}
                                placeholder="What's this course about?"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                            />
                        </div>

                        {courseError && <p className="text-xs text-red-500">{courseError}</p>}

                        <button
                            type="submit"
                            disabled={!newCourseName.trim() || courseSubmitting}
                            className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors w-full"
                        >
                            {courseSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Add Course
                        </button>
                    </form>

                    {coursesLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No courses yet</h3>
                            <p className="text-gray-500 text-sm">Add one above to let students contribute to it.</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden max-w-2xl">
                            {courses.map((course, i) => (
                                <div
                                    key={course.id}
                                    className={`flex items-center gap-4 px-6 py-4 ${i !== courses.length - 1 ? 'border-b border-gray-50' : ''}`}
                                >
                                    {course.imageUrl ? (
                                        <img src={course.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold shrink-0">
                                            {course.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm">{course.name}</p>
                                        {course.description && (
                                            <p className="text-xs text-gray-500 truncate mt-0.5">{course.description}</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-0.5">{course.questionCount} questions contributed</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteCourse(course)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                        title="Remove course"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Announcements Tab - horizontal rail shown on the main page; admin only */}
            {activeTab === 'announcements' && (
                <div>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
                        <p className="text-gray-500 text-sm mt-1">
                            Shown as a horizontal rail on the main page. Add a title, a short description, and an optional
                            image blended into the card background.
                        </p>
                    </div>

                    <form onSubmit={handleAnnouncementSubmit} className="max-w-lg mb-8 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
                        <BannerPicker idToken={adminToken} bannerUrl={announcementImage} onChange={setAnnouncementImage} />

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Title</label>
                            <input
                                value={announcementTitle}
                                onChange={(e) => setAnnouncementTitle(e.target.value.slice(0, 100))}
                                placeholder="e.g., Hackathon registrations are open"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description</label>
                            <textarea
                                value={announcementDescription}
                                onChange={(e) => setAnnouncementDescription(e.target.value.slice(0, 500))}
                                rows={3}
                                placeholder="What's this announcement about?"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Link (optional)</label>
                            <input
                                type="url"
                                value={announcementLink}
                                onChange={(e) => setAnnouncementLink(e.target.value)}
                                placeholder="https://..."
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Deadline (optional)</label>
                            <input
                                type="datetime-local"
                                value={announcementDeadline}
                                onChange={(e) => setAnnouncementDeadline(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            />
                            <p className="text-[11px] text-gray-400 mt-1">Shows a live countdown on the announcement's detail popup.</p>
                        </div>

                        {announcementError && <p className="text-xs text-red-500">{announcementError}</p>}

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={!announcementTitle.trim() || !announcementDescription.trim() || announcementSubmitting}
                                className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors flex-1"
                            >
                                {announcementSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                {editingAnnouncement ? 'Update Announcement' : 'Add Announcement'}
                            </button>
                            {editingAnnouncement && (
                                <button
                                    type="button"
                                    onClick={resetAnnouncementForm}
                                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>

                    {announcementsLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <Megaphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No announcements yet</h3>
                            <p className="text-gray-500 text-sm">Add one above to show it on the main page.</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden max-w-2xl">
                            {announcements.map((announcement, i) => (
                                <div
                                    key={announcement.id}
                                    className={`flex items-center gap-4 px-6 py-4 ${i !== announcements.length - 1 ? 'border-b border-gray-50' : ''} ${!announcement.isActive ? 'opacity-50' : ''}`}
                                >
                                    {announcement.imageUrl ? (
                                        <img src={announcement.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white shrink-0">
                                            <Megaphone className="w-5 h-5" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm truncate">{announcement.title}</p>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{announcement.description}</p>
                                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                            {!announcement.isActive && (
                                                <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full inline-block">Hidden</span>
                                            )}
                                            {announcement.link && (
                                                <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full inline-block">Has link</span>
                                            )}
                                            {announcement.deadline && (
                                                <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block">
                                                    Deadline {new Date(announcement.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleToggleAnnouncementActive(announcement)}
                                        disabled={announcementBusyId === announcement.id}
                                        className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                                        title={announcement.isActive ? 'Hide from main page' : 'Show on main page'}
                                    >
                                        {announcement.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => startEditAnnouncement(announcement)}
                                        className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors shrink-0"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAnnouncement(announcement)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Layout>
    );
};

export default AdminDashboard;
