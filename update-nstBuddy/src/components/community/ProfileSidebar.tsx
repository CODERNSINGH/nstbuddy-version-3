import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase';
import { communityApi, MyActivity } from '../../services/api';
import Avatar from './Avatar';
import TiltCard from './TiltCard';

const ProfileSidebar: React.FC = () => {
    const { user } = useAuth();
    const [activity, setActivity] = useState<MyActivity | null>(null);

    useEffect(() => {
        if (!user) return;
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return;
        firebaseUser.getIdToken().then((token) =>
            communityApi.getMyActivity(token).then((response) => {
                if (response.success) setActivity(response.activity);
            })
        );
    }, [user]);

    if (!user) {
        return (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 text-center">
                <p className="text-sm text-gray-500">Log in to see your profile and activity here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <TiltCard className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 [transform-style:preserve-3d]">
                <Link to="/profile" className="flex items-center gap-3 group">
                    <Avatar name={user.name} picture={user.picture} size="lg" />
                    <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm truncate group-hover:text-emerald-600 transition-colors">
                            {user.name}
                        </h4>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                </Link>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-50">
                    <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{activity?.postCount ?? '–'}</div>
                        <div className="text-[11px] text-gray-400">Posts</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{activity?.likeCount ?? '–'}</div>
                        <div className="text-[11px] text-gray-400">Likes</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{activity?.commentCount ?? '–'}</div>
                        <div className="text-[11px] text-gray-400">Replies</div>
                    </div>
                </div>

                <Link
                    to="/profile"
                    className="flex items-center justify-center gap-1.5 mt-4 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                    View full profile <ArrowRight className="w-3 h-3" />
                </Link>
            </TiltCard>

            {activity && activity.recent.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                    className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5"
                >
                    <h4 className="font-bold text-gray-900 text-sm mb-3">Your Activity</h4>
                    <div className="space-y-3">
                        {activity.recent.map((item, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                                <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                        item.type === 'like' ? 'bg-rose-50' : 'bg-emerald-50'
                                    }`}
                                >
                                    {item.type === 'like' ? (
                                        <Heart className="w-3 h-3 text-rose-500" />
                                    ) : (
                                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-gray-500">
                                        You {item.type === 'like' ? 'liked' : 'replied to'}{' '}
                                        <span className="font-semibold text-gray-700">{item.postAuthor}</span>
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">"{item.snippet}"</p>
                                    <p className="text-[10px] text-gray-300 mt-0.5">
                                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default ProfileSidebar;
