import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, MessageSquare, Loader2, X } from 'lucide-react';
import { communityApi, CommunityPerson } from '../../services/api';
import Avatar from './Avatar';

type Mode = 'posts' | 'people';

interface CommunitySearchProps {
    onSearchPosts: (query: string) => void;
    onSelectPerson: (email: string, name: string) => void;
}

const CommunitySearch: React.FC<CommunitySearchProps> = ({ onSearchPosts, onSelectPerson }) => {
    const [mode, setMode] = useState<Mode>('posts');
    const [query, setQuery] = useState('');
    const [people, setPeople] = useState<CommunityPerson[]>([]);
    const [loadingPeople, setLoadingPeople] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Posts mode: debounce and lift the raw query up to the feed
    useEffect(() => {
        if (mode !== 'posts') return;
        const timeout = setTimeout(() => onSearchPosts(query.trim()), 350);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, mode]);

    // People mode: debounce and query the people-search endpoint directly
    useEffect(() => {
        if (mode !== 'people') {
            setPeople([]);
            return;
        }
        if (query.trim().length < 2) {
            setPeople([]);
            return;
        }
        setLoadingPeople(true);
        const timeout = setTimeout(async () => {
            try {
                const response = await communityApi.searchPeople(query.trim(), 8);
                if (response.success) setPeople(response.people);
            } finally {
                setLoadingPeople(false);
            }
        }, 350);
        return () => clearTimeout(timeout);
    }, [query, mode]);

    const switchMode = (next: Mode) => {
        setMode(next);
        setQuery('');
        setPeople([]);
        if (next === 'posts') onSearchPosts('');
    };

    const handleSelectPerson = (person: CommunityPerson) => {
        onSelectPerson(person.email, person.name);
        setQuery('');
        setPeople([]);
    };

    return (
        <div ref={containerRef} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-3 mb-4">
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1 shrink-0">
                    <button
                        onClick={() => switchMode('posts')}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                            mode === 'posts' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <MessageSquare className="w-3.5 h-3.5" /> Posts
                    </button>
                    <button
                        onClick={() => switchMode('people')}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                            mode === 'people' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Users className="w-3.5 h-3.5" /> People
                    </button>
                </div>

                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={mode === 'posts' ? 'Search posts…' : 'Search people who have posted…'}
                        className="w-full bg-gray-50 border border-transparent rounded-full py-2 pl-9 pr-8 text-sm focus:outline-none focus:border-emerald-300 focus:bg-white transition-colors"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {mode === 'people' && query.trim().length >= 2 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-3 mt-3 border-t border-gray-50">
                            {loadingPeople ? (
                                <div className="flex justify-center py-3">
                                    <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />
                                </div>
                            ) : people.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-2">No one matching "{query}" has posted yet.</p>
                            ) : (
                                <div className="space-y-1">
                                    {people.map((person) => (
                                        <button
                                            key={person.email}
                                            onClick={() => handleSelectPerson(person)}
                                            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <Avatar name={person.name} picture={person.picture} size="sm" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{person.name}</p>
                                                <p className="text-xs text-gray-400">
                                                    {person.postCount} {person.postCount === 1 ? 'post' : 'posts'}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CommunitySearch;
