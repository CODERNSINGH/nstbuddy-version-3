import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import PostComposer from '../components/community/PostComposer';
import PostCard from '../components/community/PostCard';
import CommunitySearch from '../components/community/CommunitySearch';
import TrendingSidebar from '../components/community/TrendingSidebar';
import ProfileSidebar from '../components/community/ProfileSidebar';
import { communityApi, CommunityPost } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../config/firebase';
import { MessageSquare, Users, X, TrendingUp, Clock } from 'lucide-react';

type Sort = 'new' | 'top';

const Community: React.FC = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeHashtag, setActiveHashtag] = useState<string | null>(null);
    const [activeAuthor, setActiveAuthor] = useState<{ email: string; name: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sort, setSort] = useState<Sort>('new');
    const [trendingRefresh, setTrendingRefresh] = useState(0);
    const [highlightId, setHighlightId] = useState<string | null>(null);
    const highlightedRef = useRef<HTMLDivElement>(null);
    const resolvedPermalink = useRef(false);

    useEffect(() => {
        fetchPosts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeHashtag, activeAuthor, searchQuery, sort]);

    // Resolve deep links from elsewhere in the app (e.g. the profile page) once on mount:
    // ?post=<id> highlights a specific post, ?hashtag= or ?author=+authorName= pre-filter the feed.
    useEffect(() => {
        if (resolvedPermalink.current) return;
        resolvedPermalink.current = true;

        const postId = searchParams.get('post');
        const hashtag = searchParams.get('hashtag');
        const authorEmail = searchParams.get('author');
        const authorName = searchParams.get('authorName');

        if (hashtag) setActiveHashtag(hashtag);
        if (authorEmail) setActiveAuthor({ email: authorEmail, name: authorName || authorEmail });
        if (hashtag || authorEmail) setSearchParams({});

        if (!postId) return;

        (async () => {
            try {
                const firebaseUser = auth.currentUser;
                const token = firebaseUser ? await firebaseUser.getIdToken() : undefined;
                const response = await communityApi.getPost(postId, token);
                if (response.success) {
                    setPosts((prev) => (prev.some((p) => p.id === postId) ? prev : [response.post, ...prev]));
                    setHighlightId(postId);
                    setTimeout(() => {
                        highlightedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 200);
                    setTimeout(() => setHighlightId(null), 3000);
                }
            } catch {
                // shared post may have been deleted - ignore
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const firebaseUser = auth.currentUser;
            const token = firebaseUser ? await firebaseUser.getIdToken() : undefined;
            const response = await communityApi.getPosts(token, {
                limit: 50,
                hashtag: activeHashtag || undefined,
                author: activeAuthor?.email || undefined,
                search: searchQuery || undefined,
                sort,
            });
            if (response.success) setPosts(response.posts);
        } catch (error) {
            // empty state handles it
        } finally {
            setLoading(false);
        }
    };

    const handlePosted = (post: CommunityPost) => {
        const matchesFilters =
            (!activeHashtag || post.hashtags.includes(activeHashtag)) &&
            (!activeAuthor || post.author.email === activeAuthor.email);
        if (matchesFilters) setPosts((prev) => [post, ...prev]);
        setTrendingRefresh((n) => n + 1);
    };

    const handleUpdated = (updated: CommunityPost) => {
        setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setTrendingRefresh((n) => n + 1);
    };

    const handleDeleted = (id: string) => {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        setTrendingRefresh((n) => n + 1);
    };

    const handleAuthorClick = (email: string, name: string) => {
        setActiveAuthor({ email, name });
        setSearchParams({});
    };

    const handleHashtagClick = (tag: string) => {
        setActiveHashtag(tag);
        setSearchParams({});
    };

    const clearAllFilters = () => {
        setActiveHashtag(null);
        setActiveAuthor(null);
        setSearchQuery('');
    };

    const hasFilters = activeHashtag || activeAuthor || searchQuery;

    return (
        <Layout fullWidth>
            <div className="bg-gray-50/50 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_300px] gap-6 items-start">
                        {/* Left sidebar - profile & activity */}
                        <aside className="hidden lg:block sticky top-20">
                            <ProfileSidebar />
                        </aside>

                        {/* Feed */}
                        <div className="max-w-2xl w-full mx-auto lg:mx-0">
                            <div className="mb-6">
                                <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-full py-1.5 px-4 mb-4">
                                    <Users className="w-3.5 h-3.5 text-brand-600" />
                                    <span className="text-xs font-bold text-brand-700">Peer to peer, campus-wide</span>
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Community</h1>
                                <p className="text-gray-500">Ask questions, share tips, and talk with students across every campus.</p>
                            </div>

                            <div className="mb-6">
                                <PostComposer onPosted={handlePosted} />
                            </div>

                            {!user && (
                                <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 mb-6 text-sm text-brand-800">
                                    Log in to post, like, and reply.
                                </div>
                            )}

                            <CommunitySearch onSearchPosts={setSearchQuery} onSelectPerson={handleAuthorClick} />

                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-full p-1">
                                    <button
                                        onClick={() => setSort('new')}
                                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                                            sort === 'new' ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        <Clock className="w-3.5 h-3.5" /> Newest
                                    </button>
                                    <button
                                        onClick={() => setSort('top')}
                                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                                            sort === 'top' ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        <TrendingUp className="w-3.5 h-3.5" /> Most Liked
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {hasFilters && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            {activeHashtag && (
                                                <span className="flex items-center gap-1.5 bg-white border border-brand-100 text-brand-700 text-xs font-semibold pl-3 pr-2 py-1.5 rounded-full">
                                                    #{activeHashtag}
                                                    <button onClick={() => setActiveHashtag(null)} className="hover:text-brand-900">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            )}
                                            {activeAuthor && (
                                                <span className="flex items-center gap-1.5 bg-white border border-brand-100 text-brand-700 text-xs font-semibold pl-3 pr-2 py-1.5 rounded-full">
                                                    Posts by {activeAuthor.name}
                                                    <button onClick={() => setActiveAuthor(null)} className="hover:text-brand-900">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            )}
                                            {searchQuery && (
                                                <span className="flex items-center gap-1.5 bg-white border border-brand-100 text-brand-700 text-xs font-semibold pl-3 pr-2 py-1.5 rounded-full">
                                                    "{searchQuery}"
                                                    <button onClick={() => setSearchQuery('')} className="hover:text-brand-900">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            )}
                                            <button
                                                onClick={clearAllFilters}
                                                className="text-xs font-semibold text-gray-400 hover:text-gray-600 px-2"
                                            >
                                                Clear all
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {loading ? (
                                <div className="space-y-4">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-11 h-11 rounded-full bg-gray-100" />
                                                <div className="space-y-2">
                                                    <div className="h-3 w-24 bg-gray-100 rounded" />
                                                    <div className="h-2 w-16 bg-gray-100 rounded" />
                                                </div>
                                            </div>
                                            <div className="h-3 w-full bg-gray-100 rounded mb-2" />
                                            <div className="h-3 w-2/3 bg-gray-100 rounded" />
                                        </div>
                                    ))}
                                </div>
                            ) : posts.length === 0 ? (
                                <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl bg-white">
                                    <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">
                                        {hasFilters ? 'No posts match these filters' : 'No posts yet'}
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        {hasFilters ? 'Try a different search or clear filters.' : 'Be the first to start a conversation.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <AnimatePresence initial={false} mode="popLayout">
                                        {posts.map((post) => (
                                            <motion.div
                                                key={post.id}
                                                ref={post.id === highlightId ? highlightedRef : undefined}
                                                layout
                                                initial={{ opacity: 0, y: 16 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.96 }}
                                                whileHover={{ y: -2 }}
                                                transition={{ duration: 0.25 }}
                                            >
                                                <PostCard
                                                    post={post}
                                                    onUpdated={handleUpdated}
                                                    onDeleted={handleDeleted}
                                                    onHashtagClick={handleHashtagClick}
                                                    onAuthorClick={handleAuthorClick}
                                                    highlighted={post.id === highlightId}
                                                />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Right sidebar - trending hashtags */}
                        <aside className="hidden lg:block sticky top-20">
                            <TrendingSidebar
                                activeHashtag={activeHashtag}
                                onSelect={setActiveHashtag}
                                refreshSignal={trendingRefresh}
                            />
                        </aside>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Community;
