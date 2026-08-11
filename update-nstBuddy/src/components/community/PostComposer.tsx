import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Hash } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase';
import { communityApi, CommunityPost } from '../../services/api';
import Avatar from './Avatar';
import ImagePicker from './ImagePicker';

const MAX_LENGTH = 2000;

interface PostComposerProps {
    onPosted: (post: CommunityPost) => void;
}

const PostComposer: React.FC<PostComposerProps> = ({ onPosted }) => {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [idToken, setIdToken] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        auth.currentUser?.getIdToken().then(setIdToken);
    }, [user]);

    if (!user) return null;

    const canPost = (content.trim().length > 0 || images.length > 0) && !submitting;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canPost) return;

        setSubmitting(true);
        setError('');
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();
            const response = await communityApi.createPost(content.trim(), token, images);
            if (response.success) {
                onPosted(response.post);
                setContent('');
                setImages([]);
            } else {
                setError(response.error || 'Failed to post. Please try again.');
            }
        } catch (err) {
            setError('Failed to post. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            onSubmit={handleSubmit}
            className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 focus-within:ring-1 focus-within:ring-emerald-300 focus-within:border-emerald-300 transition-all"
        >
            <div className="flex gap-3">
                <Avatar name={user.name} picture={user.picture} />
                <div className="flex-1">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
                        placeholder="Share something with your peers… use #tags to start a trend"
                        rows={3}
                        className="w-full resize-none border-0 focus:ring-0 focus:outline-none text-[15px] text-gray-900 placeholder:text-gray-400"
                    />

                    <ImagePicker idToken={idToken} images={images} onChange={setImages} />

                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                            <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                                <Hash className="w-3 h-3" /> Add hashtags to get trending
                            </span>
                            {error && <span className="text-xs text-red-500">{error}</span>}
                            <span className={`text-xs ${content.length > MAX_LENGTH - 100 ? 'text-orange-500' : 'text-gray-400'}`}>
                                {content.length}/{MAX_LENGTH}
                            </span>
                        </div>
                        <motion.button
                            type="submit"
                            whileTap={{ scale: 0.95 }}
                            disabled={!canPost}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-sm py-2 px-5 rounded-full transition-colors"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            Post
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.form>
    );
};

export default PostComposer;
