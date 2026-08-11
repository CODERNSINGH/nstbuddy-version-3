import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, MoreHorizontal, Pencil, Trash2, Check, X, Loader2, Link2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase';
import { communityApi, CommunityPost } from '../../services/api';
import Avatar from './Avatar';
import CommentThread from './CommentThread';
import HashtagText from './HashtagText';
import ImageGrid from './ImageGrid';
import ImageLightbox from './ImageLightbox';
import ImagePicker from './ImagePicker';

interface PostCardProps {
    post: CommunityPost;
    onUpdated: (post: CommunityPost) => void;
    onDeleted: (id: string) => void;
    onHashtagClick?: (tag: string) => void;
    onAuthorClick?: (email: string, name: string) => void;
    highlighted?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, onUpdated, onDeleted, onHashtagClick, onAuthorClick, highlighted }) => {
    const { user } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [editImages, setEditImages] = useState(post.images);
    const [editToken, setEditToken] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [liking, setLiking] = useState(false);
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
                setConfirmDelete(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLike = async () => {
        if (!user || liking) return;
        setLiking(true);
        // Optimistic update
        const wasLiked = post.likedByMe;
        onUpdated({
            ...post,
            likedByMe: !wasLiked,
            likeCount: wasLiked ? post.likeCount - 1 : post.likeCount + 1,
        });
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();
            const response = await communityApi.toggleLike(post.id, token);
            if (response.success) {
                onUpdated({ ...post, likedByMe: response.liked, likeCount: response.likeCount });
            }
        } catch {
            // revert on failure
            onUpdated(post);
        } finally {
            setLiking(false);
        }
    };

    const startEdit = async () => {
        setEditContent(post.content);
        setEditImages(post.images);
        setEditing(true);
        const firebaseUser = auth.currentUser;
        if (firebaseUser) setEditToken(await firebaseUser.getIdToken());
    };

    const handleSaveEdit = async () => {
        const trimmed = editContent.trim();
        if ((!trimmed && editImages.length === 0) || saving) return;
        setSaving(true);
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();
            const response = await communityApi.updatePost(post.id, trimmed, token, editImages);
            if (response.success) {
                onUpdated(response.post);
                setEditing(false);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return;
        const token = await firebaseUser.getIdToken();
        const response = await communityApi.deletePost(post.id, token);
        if (response.success) onDeleted(post.id);
    };

    const handleCommentCountChange = (delta: number) => {
        onUpdated({ ...post, commentCount: post.commentCount + delta });
    };

    const handleCopyLink = async () => {
        const url = `${window.location.origin}/community?post=${post.id}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // clipboard unavailable, silently ignore
        }
    };

    return (
        <div
            id={`post-${post.id}`}
            className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-colors ${
                highlighted ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-gray-100'
            }`}
        >
            <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <button
                        onClick={() => onAuthorClick?.(post.author.email, post.author.name)}
                        className="flex items-center gap-3 text-left group"
                    >
                        <Avatar name={post.author.name} picture={post.author.picture} />
                        <div>
                            <h4 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-emerald-600 transition-colors">
                                {post.author.name}
                            </h4>
                            <p className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                {post.updatedAt !== post.createdAt && ' · edited'}
                            </p>
                        </div>
                    </button>

                    {!editing && (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => { setMenuOpen((o) => !o); setConfirmDelete(false); }}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
                            >
                                <MoreHorizontal className="w-4.5 h-4.5" />
                            </button>
                            {menuOpen && (
                                <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-10">
                                    {!confirmDelete ? (
                                        <>
                                            <button
                                                onClick={() => { handleCopyLink(); setMenuOpen(false); }}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link2 className="w-3.5 h-3.5" />}
                                                {copied ? 'Link copied' : 'Copy link'}
                                            </button>
                                            {post.isMine && (
                                                <>
                                                    <button
                                                        onClick={() => { startEdit(); setMenuOpen(false); }}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDelete(true)}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <div className="px-3 py-2">
                                            <p className="text-xs text-gray-500 mb-2">Delete this post?</p>
                                            <div className="flex gap-2">
                                                <button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-1.5 rounded-lg">
                                                    Delete
                                                </button>
                                                <button onClick={() => setConfirmDelete(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-1.5 rounded-lg">
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {editing ? (
                    <div className="mt-3">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value.slice(0, 2000))}
                            rows={3}
                            autoFocus
                            className="w-full text-[15px] text-gray-900 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none"
                        />
                        <ImagePicker idToken={editToken} images={editImages} onChange={setEditImages} />
                        <div className="flex justify-end gap-2 mt-2">
                            <button
                                onClick={() => { setEditing(false); setEditContent(post.content); setEditImages(post.images); }}
                                className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5"
                            >
                                <X className="w-3.5 h-3.5" /> Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={saving || (!editContent.trim() && editImages.length === 0)}
                                className="flex items-center gap-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 px-4 py-1.5 rounded-lg"
                            >
                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                Save
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {post.content && (
                            <p className="text-[15px] text-gray-800 mt-3 whitespace-pre-wrap break-words leading-relaxed">
                                <HashtagText content={post.content} onHashtagClick={onHashtagClick} />
                            </p>
                        )}
                        <ImageGrid images={post.images} onImageClick={setLightboxIndex} />
                    </>
                )}

                <div className="flex items-center gap-6 mt-4 pt-3 border-t border-gray-50">
                    <motion.button
                        onClick={handleLike}
                        disabled={!user}
                        whileTap={{ scale: 0.85 }}
                        className={`flex items-center gap-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                            post.likedByMe ? 'text-rose-600' : 'text-gray-400 hover:text-rose-500'
                        }`}
                    >
                        <motion.span
                            key={post.likedByMe ? 'liked' : 'unliked'}
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                            className="inline-flex"
                        >
                            <Heart className={`w-4.5 h-4.5 ${post.likedByMe ? 'fill-rose-600' : ''}`} />
                        </motion.span>
                        {post.likeCount > 0 && post.likeCount}
                    </motion.button>
                    <button
                        onClick={() => setCommentsOpen((o) => !o)}
                        className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                            commentsOpen ? 'text-emerald-600' : 'text-gray-400 hover:text-emerald-600'
                        }`}
                    >
                        <MessageCircle className="w-4.5 h-4.5" />
                        {post.commentCount > 0 && post.commentCount}
                    </button>
                </div>
            </div>

            <AnimatePresence initial={false}>
                {commentsOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <CommentThread postId={post.id} onCommentCountChange={handleCommentCountChange} />
                    </motion.div>
                )}
            </AnimatePresence>

            {lightboxIndex !== null && (
                <ImageLightbox
                    images={post.images}
                    index={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                    onNavigate={setLightboxIndex}
                />
            )}
        </div>
    );
};

export default PostCard;
