import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Hash, X } from 'lucide-react';
import { communityApi, TrendingHashtag } from '../../services/api';
import TiltCard from './TiltCard';

interface TrendingSidebarProps {
    activeHashtag: string | null;
    onSelect: (tag: string | null) => void;
    refreshSignal: number;
}

const TrendingSidebar: React.FC<TrendingSidebarProps> = ({ activeHashtag, onSelect, refreshSignal }) => {
    const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        communityApi.getTrendingHashtags(10).then((response) => {
            if (response.success) setHashtags(response.hashtags);
        }).finally(() => setLoading(false));
    }, [refreshSignal]);

    return (
        <TiltCard className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden [transform-style:preserve-3d]">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
                <Flame className="w-4.5 h-4.5 text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-sm">Trending in College</h3>
            </div>

            {activeHashtag && (
                <button
                    onClick={() => onSelect(null)}
                    className="w-full flex items-center justify-between px-5 py-2.5 bg-emerald-50 text-emerald-700 text-xs font-semibold"
                >
                    Showing #{activeHashtag}
                    <X className="w-3.5 h-3.5" />
                </button>
            )}

            {loading ? (
                <div className="p-5 space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-9 bg-gray-50 rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : hashtags.length === 0 ? (
                <p className="text-sm text-gray-400 px-5 py-6 text-center">
                    No trending hashtags yet — add a #tag to your post.
                </p>
            ) : (
                <div className="py-1">
                    {hashtags.map((h, i) => (
                        <motion.button
                            key={h.tag}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            onClick={() => onSelect(h.tag === activeHashtag ? null : h.tag)}
                            className={`w-full flex items-center gap-2.5 px-5 py-3 text-left transition-colors ${
                                h.tag === activeHashtag ? 'bg-emerald-50' : 'hover:bg-gray-50'
                            }`}
                        >
                            <span className="text-xs font-bold text-gray-300 w-4 shrink-0">{i + 1}</span>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-0.5">
                                    <Hash className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    {h.tag}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {h.postCount} {h.postCount === 1 ? 'post' : 'posts'}
                                </p>
                            </div>
                        </motion.button>
                    ))}
                </div>
            )}
        </TiltCard>
    );
};

export default TrendingSidebar;
