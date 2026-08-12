import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { auth } from '../../config/firebase';
import { groupsApi, ContactMethod, GroupDetail } from '../../services/api';
import ContactForm from './ContactForm';
import BannerPicker from './BannerPicker';

const CATEGORIES = ['Hackathon', 'Study Group', 'Project', 'Interview Prep', 'Other'];

interface CreateGroupModalProps {
    onClose: () => void;
    onCreated: (group: GroupDetail) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [bannerUrl, setBannerUrl] = useState<string | null>(null);
    const [capacity, setCapacity] = useState(5);
    const [contactMethod, setContactMethod] = useState<ContactMethod>('whatsapp');
    const [contactValue, setContactValue] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [idToken, setIdToken] = useState<string | null>(null);

    useEffect(() => {
        auth.currentUser?.getIdToken().then(setIdToken);
    }, []);

    const canSubmit = name.trim() && description.trim() && capacity >= 2 && contactValue.trim();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit || submitting) return;

        setSubmitting(true);
        setError('');
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();
            const response = await groupsApi.create(
                {
                    name: name.trim(),
                    description: description.trim(),
                    category,
                    bannerUrl: bannerUrl || undefined,
                    capacity,
                    contactMethod,
                    contactValue: contactValue.trim(),
                },
                token
            );
            if (response.success) {
                onCreated(response.group);
            } else {
                setError(response.error || 'Failed to create group');
            }
        } catch (err) {
            setError('Failed to create group. Please try again.');
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
                        <h3 className="font-bold text-gray-900">Create a group</h3>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-5">
                        <BannerPicker idToken={idToken} bannerUrl={bannerUrl} onChange={setBannerUrl} />

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Group name</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value.slice(0, 80))}
                                placeholder="e.g. Smart India Hackathon Squad"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                                rows={3}
                                placeholder="What's this group for? What are you looking for in teammates?"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
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
                                    min={2}
                                    max={100}
                                    value={capacity}
                                    onChange={(e) => setCapacity(Math.max(2, Math.min(100, parseInt(e.target.value) || 2)))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                                />
                            </div>
                        </div>

                        <ContactForm
                            contactMethod={contactMethod}
                            contactValue={contactValue}
                            onMethodChange={setContactMethod}
                            onValueChange={setContactValue}
                        />

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
                            className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Create group
                        </button>
                    </div>
                </motion.form>
            </motion.div>
        </AnimatePresence>
    );
};

export default CreateGroupModal;
