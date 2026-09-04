import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Megaphone, X, ExternalLink, Timer } from 'lucide-react';
import { announcementsApi } from '../services/api';
import { imagePreviewUrl } from '../services/imagekit';
import { Announcement } from '../types';

const getTimeRemaining = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return { expired: true, text: 'Ended' };

    const minutes = Math.floor(diff / 60000);
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;

    if (days > 0) return { expired: false, text: `${days}d ${hours}h left` };
    if (hours > 0) return { expired: false, text: `${hours}h ${mins}m left` };
    return { expired: false, text: `${mins}m left` };
};

// Ticks its own interval so cards/modal stay live without re-fetching data
const Countdown: React.FC<{ deadline: string; className?: string }> = ({ deadline, className }) => {
    const [remaining, setRemaining] = useState(() => getTimeRemaining(deadline));

    useEffect(() => {
        const interval = setInterval(() => setRemaining(getTimeRemaining(deadline)), 30000);
        return () => clearInterval(interval);
    }, [deadline]);

    return (
        <span className={className}>
            <Timer className="w-3 h-3" /> {remaining.expired ? 'Ended' : remaining.text}
        </span>
    );
};

const Announcements: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Announcement | null>(null);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    useEffect(() => {
        if (!selected) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelected(null);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [selected]);

    const fetchAnnouncements = async () => {
        try {
            const response = await announcementsApi.getActive();
            if (response.success) setAnnouncements(response.announcements);
        } catch (error) {
            // Error fetching announcements silently
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="mb-16 animate-pulse">
                <div className="h-6 w-32 bg-gray-100 rounded mb-4"></div>
                <div className="flex gap-5">
                    <div className="h-56 w-80 shrink-0 bg-gray-100 rounded-3xl"></div>
                    <div className="h-56 w-80 shrink-0 bg-gray-100 rounded-3xl"></div>
                </div>
            </div>
        );
    }

    if (announcements.length === 0) return null;

    return (
        <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                    <Megaphone className="w-4 h-4 text-brand-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
            </div>

            <div className="flex gap-5 overflow-x-auto pb-4 -mx-1 px-1 snap-x snap-mandatory">
                {announcements.map((announcement) => {
                    const bgUrl = announcement.imageUrl ? imagePreviewUrl(announcement.imageUrl, 800) : null;

                    return (
                        <motion.button
                            key={announcement.id}
                            onClick={() => setSelected(announcement)}
                            whileHover={{ y: -4 }}
                            className="relative text-left shrink-0 w-80 h-56 rounded-3xl overflow-hidden snap-start shadow-sm hover:shadow-xl transition-shadow duration-300"
                        >
                            {/* Background: image blended with brand gradient, or a plain brand gradient when no image */}
                            {bgUrl ? (
                                <>
                                    <div
                                        className="absolute inset-0 bg-cover bg-center scale-105"
                                        style={{ backgroundImage: `url(${bgUrl})` }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand-900/85 via-brand-800/75 to-black/60" />
                                </>
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-[#16191D]" />
                            )}
                            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

                            {announcement.deadline && (
                                <Countdown
                                    deadline={announcement.deadline}
                                    className="absolute top-4 right-4 z-10 flex items-center gap-1 text-[11px] font-semibold text-white bg-black/30 backdrop-blur px-2.5 py-1 rounded-full"
                                />
                            )}

                            {/* Content */}
                            <div className="relative z-10 h-full flex flex-col justify-end p-6">
                                <h3 className="text-lg font-bold text-white leading-snug mb-2 line-clamp-2">
                                    {announcement.title}
                                </h3>
                                <p className="text-sm text-white/80 line-clamp-3">
                                    {announcement.description}
                                </p>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelected(null)}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 12 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                        >
                            <button
                                onClick={() => setSelected(null)}
                                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
                            >
                                <X className="w-4.5 h-4.5" />
                            </button>

                            {/* Hero */}
                            <div className="relative h-48 shrink-0">
                                {selected.imageUrl ? (
                                    <>
                                        <div
                                            className="absolute inset-0 bg-cover bg-center"
                                            style={{ backgroundImage: `url(${imagePreviewUrl(selected.imageUrl, 1000)})` }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                                    </>
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-[#16191D]" />
                                )}
                                <div className="absolute inset-0 flex flex-col justify-end p-6">
                                    <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center mb-3">
                                        <Megaphone className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white leading-tight">{selected.title}</h2>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-6 overflow-y-auto space-y-5">
                                {selected.deadline && (
                                    <Countdown
                                        deadline={selected.deadline}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full"
                                    />
                                )}

                                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{selected.description}</p>

                                {selected.link && (
                                    <a
                                        href={selected.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                                    >
                                        Visit link <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Announcements;
