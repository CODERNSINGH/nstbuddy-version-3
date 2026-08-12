import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import GroupCard from '../components/groups/GroupCard';
import CreateGroupModal from '../components/groups/CreateGroupModal';
import { groupsApi, GroupSummary } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../config/firebase';
import { Search, Plus, Users2, Sparkles, Layers, DoorOpen } from 'lucide-react';

type Tab = 'discover' | 'mine';

const Groups: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState<Tab>('discover');
    const [groups, setGroups] = useState<GroupSummary[]>([]);
    const [myGroupCount, setMyGroupCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        fetchGroups();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    useEffect(() => {
        if (tab !== 'discover') return;
        const timeout = setTimeout(fetchGroups, 350);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    useEffect(() => {
        if (!user) return;
        auth.currentUser?.getIdToken().then((token) =>
            groupsApi.getMy(token).then((response) => {
                if (response.success) setMyGroupCount(response.groups.length);
            })
        );
    }, [user, tab]);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const firebaseUser = auth.currentUser;
            const token = firebaseUser ? await firebaseUser.getIdToken() : undefined;

            if (tab === 'mine' && token) {
                const response = await groupsApi.getMy(token);
                if (response.success) setGroups(response.groups);
            } else {
                const response = await groupsApi.getAll(token, { search: search.trim() || undefined, limit: 50 });
                if (response.success) setGroups(response.groups);
            }
        } catch (error) {
            // empty state handles it
        } finally {
            setLoading(false);
        }
    };

    const openSpots = useMemo(
        () => groups.reduce((sum, g) => sum + (g.isActive ? Math.max(0, g.capacity - g.memberCount) : 0), 0),
        [groups]
    );

    return (
        <Layout fullWidth>
            <div className="bg-white min-h-screen">
                {/* Hero */}
                <div className="relative pt-16 pb-12 overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-100/60 via-transparent to-transparent -z-10"></div>
                    <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-brand-50/50 via-transparent to-transparent -z-10"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                            <div>
                                <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-full py-1.5 px-4 mb-6">
                                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                                    <span className="text-xs font-bold text-brand-700">Find teammates, build something together</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4 tracking-tight max-w-xl">
                                    Build your dream team. <span className="text-brand-600">Together.</span>
                                </h1>
                                <p className="text-lg text-gray-600 max-w-lg">
                                    Create a group for your next hackathon or project, or join one that's looking for people.
                                </p>
                            </div>

                            {user && (
                                <button
                                    onClick={() => setShowCreate(true)}
                                    className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm py-3.5 px-6 rounded-full transition-colors shrink-0"
                                >
                                    <Plus className="w-4 h-4" /> Create a group
                                </button>
                            )}
                        </div>

                        {/* Real stats */}
                        <div className="grid grid-cols-3 gap-4 max-w-2xl mt-10">
                            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
                                <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center mb-3">
                                    <Layers className="w-4.5 h-4.5 text-brand-600" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{loading ? '–' : groups.length}</div>
                                <div className="text-xs text-gray-500">{tab === 'mine' ? 'Your groups' : 'Groups listed'}</div>
                            </div>
                            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
                                <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center mb-3">
                                    <DoorOpen className="w-4.5 h-4.5 text-brand-600" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{loading ? '–' : openSpots}</div>
                                <div className="text-xs text-gray-500">Open spots</div>
                            </div>
                            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
                                <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center mb-3">
                                    <Users2 className="w-4.5 h-4.5 text-brand-600" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{user ? (myGroupCount ?? '–') : '–'}</div>
                                <div className="text-xs text-gray-500">You're in</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
                        <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1 shrink-0">
                            <button
                                onClick={() => setTab('discover')}
                                className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
                                    tab === 'discover' ? 'bg-white shadow-sm text-brand-700' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Discover
                            </button>
                            {user && (
                                <button
                                    onClick={() => setTab('mine')}
                                    className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
                                        tab === 'mine' ? 'bg-white shadow-sm text-brand-700' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    My Groups
                                </button>
                            )}
                        </div>

                        {tab === 'discover' && (
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-gray-300 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search groups by name…"
                                    className="w-full bg-gray-50 border border-transparent rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-300 focus:bg-white transition-colors"
                                />
                            </div>
                        )}
                    </div>

                    {!user && tab === 'discover' && (
                        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 mb-6 text-sm text-brand-800">
                            Log in to create a group or join one.
                        </div>
                    )}

                    {loading ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse h-44">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-11 h-11 rounded-xl bg-gray-100 shrink-0" />
                                        <div className="h-4 w-1/2 bg-gray-100 rounded" />
                                    </div>
                                    <div className="h-3 w-full bg-gray-100 rounded mb-1.5" />
                                    <div className="h-3 w-3/4 bg-gray-100 rounded" />
                                </div>
                            ))}
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
                            <Users2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">
                                {tab === 'mine' ? "You haven't joined or created any groups yet" : 'No groups match your search'}
                            </p>
                            {user && (
                                <button
                                    onClick={() => setShowCreate(true)}
                                    className="mt-4 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-2 px-5 rounded-full transition-colors"
                                >
                                    Create the first one
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <AnimatePresence initial={false}>
                                {groups.map((group) => (
                                    <motion.div
                                        key={group.id}
                                        layout
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.96 }}
                                    >
                                        <GroupCard group={group} onClick={() => navigate(`/groups/${group.id}`)} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {showCreate && (
                <CreateGroupModal
                    onClose={() => setShowCreate(false)}
                    onCreated={(group) => {
                        setShowCreate(false);
                        navigate(`/groups/${group.id}`);
                    }}
                />
            )}
        </Layout>
    );
};

export default Groups;
