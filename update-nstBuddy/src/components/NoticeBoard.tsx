import React, { useEffect, useState } from 'react';
import { noticesApi } from '../services/api';
import { Notice } from '../types';
import { ExternalLink } from 'lucide-react';

const NoticeBoard: React.FC = () => {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotices();
        // Auto-refresh every 5 minutes
        const interval = setInterval(fetchNotices, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotices = async () => {
        try {
            const data = await noticesApi.getActive();
            setNotices(data);
        } catch (error) {
            // Error fetching notices silently
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (link: string) => {
        if (link) {
            window.open(link, '_blank', 'noopener,noreferrer');
        }
    };

    if (loading) {
        return (
            <div className="mb-10 space-y-4 animate-pulse">
                <div className="h-6 w-20 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-100 rounded-xl"></div>
                <div className="h-64 bg-gray-100 rounded-xl"></div>
            </div>
        );
    }

    if (notices.length === 0) {
        return null;
    }

    return (
        <div className="mb-10">
            {/* Simple Header */}
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Notice</h2>

            {/* Notice Cards with Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notices.map((notice) => {
                    // content = image URL, priority = redirect link
                    const imageUrl = notice.content;
                    const redirectLink = notice.priority;

                    return (
                        <div
                            key={notice.id}
                            onClick={() => handleCardClick(redirectLink)}
                            className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1"
                        >
                            {/* Image Container */}
                            <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                                <img
                                    src={imageUrl}
                                    alt={notice.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                                    }}
                                />
                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                                    <ExternalLink className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-900 text-base leading-snug mb-2 group-hover:text-emerald-600 transition-colors">
                                    {notice.title}
                                </h3>

                                {/* Footer */}
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>
                                        {new Date(notice.createdAt).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </span>
                                    {notice.expiresAt && (
                                        <span className="text-amber-600 font-medium">
                                            Expires {new Date(notice.expiresAt).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short'
                                            })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default NoticeBoard;
