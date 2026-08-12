import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import Avatar from '../components/community/Avatar';
import ContactForm from '../components/groups/ContactForm';
import EditGroupModal from '../components/groups/EditGroupModal';
import { groupsApi, GroupDetail as GroupDetailType, ContactMethod } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../config/firebase';
import {
    Users,
    ArrowLeft,
    Pencil,
    Trash2,
    LogOut,
    Loader2,
    Phone,
    MessageCircle,
    Mail,
    Copy,
    Check,
    Shield,
    Lock,
    X,
    Link2,
    Calendar,
    Tag,
    CircleDot,
    UserPlus,
    UserMinus,
} from 'lucide-react';

const contactIcon: Record<ContactMethod, React.ElementType> = { phone: Phone, whatsapp: MessageCircle, email: Mail };

const GroupDetail: React.FC = () => {
    const { groupId } = useParams<{ groupId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [group, setGroup] = useState<GroupDetailType | null>(null);
    const [loading, setLoading] = useState(true);
    const [showEdit, setShowEdit] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmLeave, setConfirmLeave] = useState(false);
    const [busy, setBusy] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    const [showJoinForm, setShowJoinForm] = useState(false);
    const [joinMethod, setJoinMethod] = useState<ContactMethod>('whatsapp');
    const [joinValue, setJoinValue] = useState('');
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState('');

    const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        fetchGroup();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupId]);

    const fetchGroup = async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            const firebaseUser = auth.currentUser;
            const token = firebaseUser ? await firebaseUser.getIdToken() : undefined;
            const response = await groupsApi.getById(groupId, token);
            if (response.success) setGroup(response.group);
        } catch {
            // not-found state handles it
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupId || !joinValue.trim() || joining) return;
        setJoining(true);
        setJoinError('');
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();
            const response = await groupsApi.join(groupId, { contactMethod: joinMethod, contactValue: joinValue.trim() }, token);
            if (response.success) {
                setGroup(response.group);
                setShowJoinForm(false);
                setJoinValue('');
            } else {
                setJoinError(response.error || 'Failed to join group');
            }
        } catch {
            setJoinError('Failed to join group. Please try again.');
        } finally {
            setJoining(false);
        }
    };

    const handleLeave = async () => {
        if (!groupId) return;
        setBusy(true);
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();
            const response = await groupsApi.leave(groupId, token);
            if (response.success) fetchGroup();
        } finally {
            setBusy(false);
            setConfirmLeave(false);
        }
    };

    const handleDelete = async () => {
        if (!groupId) return;
        setBusy(true);
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();
            const response = await groupsApi.remove(groupId, token);
            if (response.success) navigate('/groups');
        } finally {
            setBusy(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!groupId) return;
        setBusy(true);
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();
            const response = await groupsApi.removeMember(groupId, memberId, token);
            if (response.success) fetchGroup();
        } finally {
            setBusy(false);
            setRemoveConfirmId(null);
        }
    };

    const handleCopy = async (memberId: string, value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopiedId(memberId);
            setTimeout(() => setCopiedId(null), 1500);
        } catch {
            // clipboard unavailable, ignore
        }
    };

    const handleCopyInviteLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 1500);
        } catch {
            // clipboard unavailable, ignore
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                </div>
            </Layout>
        );
    }

    if (!group) {
        return (
            <Layout>
                <div className="text-center py-20">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Group not found</h2>
                    <p className="text-gray-500 mb-6">It may have been deleted.</p>
                    <button
                        onClick={() => navigate('/groups')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-full transition-colors"
                    >
                        Browse groups
                    </button>
                </div>
            </Layout>
        );
    }

    const pct = Math.min(100, Math.round((group.memberCount / group.capacity) * 100));
    const spotsLeft = group.capacity - group.memberCount;

    return (
        <Layout fullWidth>
            <div className="bg-gray-50/50 min-h-screen">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <button
                        onClick={() => navigate('/groups')}
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to groups
                    </button>

                    {/* Hero */}
                    <div className="relative rounded-3xl overflow-hidden mb-6">
                        <div className="absolute inset-0 bg-[#0d1f17]" />
                        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full blur-[110px] opacity-30 -mr-32 -mt-32" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400 rounded-full blur-[90px] opacity-15 -mb-24 -ml-16" />

                        <div className="relative z-10 p-8 sm:p-10">
                            <div className="flex flex-wrap items-center gap-2 mb-5">
                                {group.category && (
                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-200 bg-white/10 px-3 py-1.5 rounded-full">
                                        <Tag className="w-3 h-3" /> {group.category}
                                    </span>
                                )}
                                {!group.isActive && (
                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 bg-white/10 px-3 py-1.5 rounded-full">
                                        <Lock className="w-3 h-3" /> Closed to new members
                                    </span>
                                )}
                                {group.isActive && group.isFull && (
                                    <span className="text-xs font-semibold text-orange-200 bg-orange-400/20 px-3 py-1.5 rounded-full">
                                        Full
                                    </span>
                                )}
                                {group.isActive && !group.isFull && (
                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-200 bg-emerald-400/10 px-3 py-1.5 rounded-full">
                                        <CircleDot className="w-3 h-3" /> {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight max-w-2xl">{group.name}</h1>
                            <p className="text-white/70 max-w-xl mb-6 whitespace-pre-wrap break-words leading-relaxed">
                                {group.description}
                            </p>

                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                    <Avatar name={group.creator.name} picture={group.creator.picture} size="sm" />
                                    <div className="text-sm">
                                        <span className="text-white/50">Created by </span>
                                        <span className="font-semibold text-white">{group.creator.name}</span>
                                        <span className="text-white/50"> · {formatDistanceToNow(new Date(group.createdAt), { addSuffix: true })}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCopyInviteLink}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-full transition-colors"
                                >
                                    {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                                    {linkCopied ? 'Link copied' : 'Copy invite link'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start mb-6">
                        {/* Actions */}
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                            {group.isMine ? (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Admin controls</h3>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={() => setShowEdit(true)}
                                            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-2.5 px-5 rounded-xl transition-colors"
                                        >
                                            <Pencil className="w-4 h-4" /> Edit group
                                        </button>
                                        {!confirmDelete ? (
                                            <button
                                                onClick={() => setConfirmDelete(true)}
                                                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm py-2.5 px-5 rounded-xl transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" /> Delete group
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2 bg-red-50 rounded-xl px-4 py-2">
                                                <span className="text-sm text-red-700 font-medium">Delete permanently?</span>
                                                <button
                                                    onClick={handleDelete}
                                                    disabled={busy}
                                                    className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg"
                                                >
                                                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete'}
                                                </button>
                                                <button onClick={() => setConfirmDelete(false)} className="text-xs font-semibold text-gray-500 px-2">
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : group.isMember ? (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">You're a member</h3>
                                    {!confirmLeave ? (
                                        <button
                                            onClick={() => setConfirmLeave(true)}
                                            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-2.5 px-5 rounded-xl transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" /> Leave group
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2 w-fit">
                                            <span className="text-sm text-gray-600 font-medium">Leave this group?</span>
                                            <button
                                                onClick={handleLeave}
                                                disabled={busy}
                                                className="text-xs font-bold text-white bg-gray-700 hover:bg-gray-800 px-3 py-1.5 rounded-lg"
                                            >
                                                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Leave'}
                                            </button>
                                            <button onClick={() => setConfirmLeave(false)} className="text-xs font-semibold text-gray-500 px-2">
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : !user ? (
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <UserPlus className="w-5 h-5 text-gray-300" /> Log in to join this group.
                                </div>
                            ) : !group.isActive ? (
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <Lock className="w-5 h-5 text-gray-300" /> This group is closed to new members.
                                </div>
                            ) : group.isFull ? (
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <UserMinus className="w-5 h-5 text-gray-300" /> This group is full.
                                </div>
                            ) : !showJoinForm ? (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Want in?</h3>
                                    <button
                                        onClick={() => setShowJoinForm(true)}
                                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-2.5 px-6 rounded-xl transition-colors"
                                    >
                                        <UserPlus className="w-4 h-4" /> Join this group
                                    </button>
                                </div>
                            ) : (
                                <motion.form
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onSubmit={handleJoin}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-bold text-gray-800">Join {group.name}</h4>
                                        <button type="button" onClick={() => setShowJoinForm(false)} className="text-gray-400 hover:text-gray-600">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <ContactForm
                                        contactMethod={joinMethod}
                                        contactValue={joinValue}
                                        onMethodChange={setJoinMethod}
                                        onValueChange={setJoinValue}
                                    />
                                    {joinError && <p className="text-xs text-red-500 mt-2">{joinError}</p>}
                                    <button
                                        type="submit"
                                        disabled={!joinValue.trim() || joining}
                                        className="mt-3 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-sm py-2.5 px-6 rounded-xl transition-colors"
                                    >
                                        {joining && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Confirm & Join
                                    </button>
                                </motion.form>
                            )}
                        </div>

                        {/* Meta sidebar */}
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                    <Users className="w-4 h-4" /> Capacity
                                </span>
                                <span className="font-bold text-gray-900 text-sm">{group.memberCount} / {group.capacity}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
                                <div
                                    className={`h-full rounded-full transition-all ${group.isFull ? 'bg-orange-400' : 'bg-gradient-to-r from-emerald-400 to-emerald-600'}`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>

                            <div className="space-y-3 pt-4 border-t border-gray-50 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-gray-500">
                                        <Tag className="w-3.5 h-3.5" /> Category
                                    </span>
                                    <span className="font-medium text-gray-800">{group.category || 'General'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-gray-500">
                                        <CircleDot className="w-3.5 h-3.5" /> Status
                                    </span>
                                    <span className={`font-medium ${group.isActive ? 'text-emerald-600' : 'text-gray-500'}`}>
                                        {group.isActive ? 'Open' : 'Closed'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-gray-500">
                                        <Calendar className="w-3.5 h-3.5" /> Created
                                    </span>
                                    <span className="font-medium text-gray-800">
                                        {new Date(group.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Members */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 mb-5">Members ({group.memberCount})</h3>
                        <div className="space-y-1">
                            <AnimatePresence initial={false}>
                                {group.members.map((member) => {
                                    const ContactIcon = member.contact ? contactIcon[member.contact.method] : null;
                                    return (
                                        <motion.div
                                            key={member.id}
                                            layout
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex items-center justify-between gap-3 py-3.5 border-b border-gray-50 last:border-0"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Avatar name={member.name} picture={member.picture} />
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-semibold text-gray-900 text-sm truncate">{member.name}</span>
                                                        {member.role === 'admin' && (
                                                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                                                <Shield className="w-2.5 h-2.5" /> Admin
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-400">
                                                        Joined {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                {member.contact && ContactIcon && (
                                                    <button
                                                        onClick={() => handleCopy(member.id, member.contact!.value)}
                                                        className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        <ContactIcon className="w-3.5 h-3.5 text-emerald-600" />
                                                        <span className="max-w-[100px] sm:max-w-[140px] truncate">{member.contact.value}</span>
                                                        {copiedId === member.id ? (
                                                            <Check className="w-3 h-3 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="w-3 h-3 text-gray-400" />
                                                        )}
                                                    </button>
                                                )}
                                                {group.isMine && member.role !== 'admin' && (
                                                    removeConfirmId === member.id ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => handleRemoveMember(member.id)}
                                                                disabled={busy}
                                                                className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-2.5 py-1.5 rounded-lg"
                                                            >
                                                                Remove
                                                            </button>
                                                            <button
                                                                onClick={() => setRemoveConfirmId(null)}
                                                                className="text-xs font-semibold text-gray-500 px-1.5"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setRemoveConfirmId(member.id)}
                                                            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                                                            title="Remove member"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {showEdit && (
                <EditGroupModal
                    group={group}
                    onClose={() => setShowEdit(false)}
                    onSaved={(updated) => {
                        setGroup(updated);
                        setShowEdit(false);
                    }}
                />
            )}
        </Layout>
    );
};

export default GroupDetail;
