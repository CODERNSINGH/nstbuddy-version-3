import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { auth } from '../../config/firebase';
import { groupsApi, GroupDetail as GroupDetailType } from '../../services/api';

const CATEGORIES = ['Hackathon', 'Study Group', 'Project', 'Interview Prep', 'Other'];

interface EditGroupModalProps {
    group: GroupDetailType;
    onClose: () => void;
    onSaved: (group: GroupDetailType) => void;
}

const EditGroupModal: React.FC<EditGroupModalProps> = ({ group, onClose, onSaved }) => {
    const [name, setName] = useState(group.name);
    const [description, setDescription] = useState(group.description);
    const [category, setCategory] = useState(group.category || CATEGORIES[0]);
    const [capacity, setCapacity] = useState(group.capacity);
    const [isActive, setIsActive] = useState(group.isActive);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const canSubmit = name.trim() && description.trim() && capacity >= group.memberCount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit || submitting) return;

        setSubmitting(true);
        setError('');
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();
            const response = await groupsApi.update(
                group.id,
                { name: name.trim(), description: description.trim(), category, capacity, isActive },
                token
            );
            if (response.success) {
                onSaved(response.group);
            } else {
                setError(response.error || 'Failed to update group');
            }
        } catch (err) {
            setError('Failed to update group. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
            >
                <motion.form
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                    onSubmit={handleSubmit}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
                        <h3 className="font-bold text-gray-900">Edit group</h3>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Group name</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value.slice(0, 80))}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                                rows={3}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                                >
                                    {CATEGORIES.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Capacity</label>
                                <input
                                    type="number"
                                    min={group.memberCount}
                                    max={100}
                                    value={capacity}
                                    onChange={(e) => setCapacity(Math.max(group.memberCount, Math.min(100, parseInt(e.target.value) || group.memberCount)))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                                />
                                <p className="text-[11px] text-gray-400 mt-1">Min {group.memberCount} (current members)</p>
                            </div>
                        </div>

                        <label className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 cursor-pointer">
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Open to new members</p>
                                <p className="text-xs text-gray-400">Turn off to stop accepting joins without deleting the group</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="w-5 h-5 accent-emerald-600"
                            />
                        </label>

                        {error && <p className="text-xs text-red-500">{error}</p>}
                    </div>

                    <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-2.5 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit || submitting}
                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save changes
                        </button>
                    </div>
                </motion.form>
            </motion.div>
        </AnimatePresence>
    );
};

export default EditGroupModal;
