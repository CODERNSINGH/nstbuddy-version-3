import React, { useEffect, useRef, useState } from 'react';
import { Search, ExternalLink, Loader2 } from 'lucide-react';
import { questionsApi } from '../../services/api';

interface SearchResult {
    id: string;
    questionName: string;
    subject: string;
    topic: string;
    link: string;
    campus: { name: string; slug: string };
}

const GlobalSearch: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const timeout = setTimeout(async () => {
            try {
                const response = await questionsApi.getAll({ search: query.trim(), limit: 6 });
                if (response.success) {
                    setResults(response.questions);
                }
            } catch (error) {
                // Search failed silently
            } finally {
                setLoading(false);
            }
        }, 350);

        return () => clearTimeout(timeout);
    }, [query]);

    return (
        <div className="relative hidden md:block" ref={containerRef}>
            <div className="relative flex items-center">
                <Search className="w-4 h-4 text-gray-400 absolute left-3" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setOpen(true)}
                    placeholder="Search questions..."
                    className="bg-gray-50 border border-gray-200 rounded-full py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 w-64 transition-colors"
                />
                {loading && <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin absolute right-3" />}
            </div>

            {open && query.trim().length >= 2 && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                    {results.length === 0 && !loading ? (
                        <p className="px-4 py-6 text-sm text-gray-500 text-center">No questions match "{query}"</p>
                    ) : (
                        results.map((result) => (
                            <a
                                key={result.id}
                                href={result.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setOpen(false)}
                                className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                            >
                                <ExternalLink className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{result.questionName}</p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {result.subject} · {result.campus.name}
                                    </p>
                                </div>
                            </a>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
