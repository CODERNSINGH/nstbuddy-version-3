import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Send, Loader2, Pencil, Trash2, Check, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase';
import { communityApi, CommunityComment } from '../../services/api';
import Avatar from './Avatar';

interface CommentThreadProps {
    postId: string;
    onCommentCountChange: (delta: number) => void;
}

const CommentThread: React.FC<CommentThreadProps> = ({ postId, onCommentCountChange }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState<CommunityComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        communityApi.getComments(postId).then((response) => {
            if (!cancelled && response.success) setComments(response.comments);
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [postId]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newComment.trim();
        if (!trimmed || submitting) return;

        setSubmitting(true);
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();
            const response = await communityApi.addComment(postId, trimmed, token);
            if (response.success) {
                setComments((prev) => [...prev, response.comment]);
                setNewComment('');
                onCommentCountChange(1);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const startEdit = (comment: CommunityComment) => {
        setEditingId(comment.id);
        setEditContent(comment.content);
    };

    const saveEdit = async (id: string) => {
        const trimmed = editContent.trim();
        if (!trimmed) return;
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return;
        const token = await firebaseUser.getIdToken();
        const response = await communityApi.updateComment(id, trimmed, token);
        if (response.success) {
            setComments((prev) => prev.map((c) => (c.id === id ? response.comment : c)));
            setEditingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return;
        const token = await firebaseUser.getIdToken();
        const response = await communityApi.deleteComment(id, token);
        if (response.success) {
            setComments((prev) => prev.filter((c) => c.id !== id));
            setConfirmDeleteId(null);
            onCommentCountChange(-1);
        }
    };

    return (
        <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4 space-y-4">
            {loading ? (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
                </div>
            ) : comments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-2">No replies yet — be the first to respond.</p>
            ) : (
                comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                        <Avatar name={comment.author.name} picture={comment.author.picture} size="sm" />
                        <div className="flex-1 min-w-0">
                            <div className="bg-white rounded-2xl px-4 py-2.5 border border-gray-100">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-semibold text-gray-900">{comment.author.name}</span>
                                    <span className="text-[11px] text-gray-400 shrink-0">
                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                    </span>
                                </div>

                                {editingId === comment.id ? (
                                    <div className="mt-1.5">
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            rows={2}
                                            className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                        />
                                        <div className="flex justify-end gap-2 mt-1.5">
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1"
                                            >
                                                <X className="w-3 h-3" /> Cancel
                                            </button>
                                            <button
                                                onClick={() => saveEdit(comment.id)}
                                                className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 px-2 py-1"
                                            >
                                                <Check className="w-3 h-3" /> Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap break-words">{comment.content}</p>
                                )}
                            </div>

                            {user?.email === comment.author.email && editingId !== comment.id && (
                                <div className="flex items-center gap-3 mt-1 ml-1">
                                    {confirmDeleteId === comment.id ? (
                                        <>
                                            <span className="text-xs text-gray-400">Delete this reply?</span>
                                            <button onClick={() => handleDelete(comment.id)} className="text-xs font-semibold text-red-600 hover:text-red-700">
                                                Delete
                                            </button>
                                            <button onClick={() => setConfirmDeleteId(null)} className="text-xs font-medium text-gray-500 hover:text-gray-700">
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => startEdit(comment)}
                                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600"
                                            >
                                                <Pencil className="w-3 h-3" /> Edit
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteId(comment.id)}
                                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-600"
                                            >
                                                <Trash2 className="w-3 h-3" /> Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}

            {user && (
                <form onSubmit={handleAdd} className="flex items-center gap-3 pt-1">
                    <Avatar name={user.name} picture={user.picture} size="sm" />
                    <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-full pl-4 pr-1.5 py-1.5 focus-within:ring-1 focus-within:ring-emerald-400 focus-within:border-emerald-400">
                        <input
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value.slice(0, 1000))}
                            placeholder="Write a reply…"
                            className="flex-1 text-sm border-0 focus:ring-0 focus:outline-none bg-transparent"
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || submitting}
                            className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 text-white transition-colors"
                        >
                            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default CommentThread;
