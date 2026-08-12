import React from 'react';
import { motion } from 'framer-motion';
import { Users, ArrowRight, Lock } from 'lucide-react';
import { GroupSummary } from '../../services/api';
import { imagePreviewUrl } from '../../services/imagekit';
import Avatar from '../community/Avatar';

interface GroupCardProps {
    group: GroupSummary;
    onClick: () => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, onClick }) => {
    const pct = Math.min(100, Math.round((group.memberCount / group.capacity) * 100));

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ y: -3 }}
            className="w-full text-left bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
        >
            {group.bannerUrl && (
                <div className="h-28 w-full overflow-hidden shrink-0">
                    <img src={imagePreviewUrl(group.bannerUrl, 500)} alt="" className="w-full h-full object-cover" />
                </div>
            )}

            <div className="p-5 flex flex-col gap-3 flex-1">
            <div className="flex items-start gap-3">
                {!group.bannerUrl && (
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {group.name.charAt(0).toUpperCase()}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {group.category && (
                            <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                                {group.category}
                            </span>
                        )}
                        {!group.isActive && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                <Lock className="w-2.5 h-2.5" /> Closed
                            </span>
                        )}
                        {group.isActive && group.isFull && (
                            <span className="text-[10px] font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full">
                                Full
                            </span>
                        )}
                        {group.isMember && (
                            <span className="text-[10px] font-semibold text-brand-600">
                                {group.isMine ? 'You admin' : 'Joined'}
                            </span>
                        )}
                    </div>
                    <h3 className="font-bold text-gray-900 truncate">{group.name}</h3>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 shrink-0 mt-1.5" />
            </div>

            <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">{group.description}</p>

            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <Avatar name={group.creator.name} picture={group.creator.picture} size="sm" />
                        <span className="text-xs text-gray-500 truncate">{group.creator.name}</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-medium text-gray-500 shrink-0">
                        <Users className="w-3.5 h-3.5" /> {group.memberCount}/{group.capacity}
                    </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${group.isFull ? 'bg-orange-400' : 'bg-brand-500'}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
            </div>
        </motion.button>
    );
};

export default GroupCard;
