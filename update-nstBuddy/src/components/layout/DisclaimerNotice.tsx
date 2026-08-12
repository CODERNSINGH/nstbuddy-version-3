import React, { useState } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase';
import { authAPI } from '../../services/auth';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const DisclaimerNotice: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const [submitting, setSubmitting] = useState(false);

    if (!user) return null;

    const lastAcknowledged = user.disclaimerAcknowledgedAt ? new Date(user.disclaimerAcknowledgedAt).getTime() : null;
    const shouldShow = !lastAcknowledged || Date.now() - lastAcknowledged > SEVEN_DAYS_MS;

    if (!shouldShow) return null;

    const handleAcknowledge = async () => {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return;

        setSubmitting(true);
        try {
            const token = await firebaseUser.getIdToken();
            await authAPI.acknowledgeDisclaimer(token);
            await refreshUser();
        } catch (error) {
            // If the request fails, leave the modal open so the user can retry
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                <div className="p-8">
                    <div className="flex justify-center mb-5">
                        <div className="p-3 bg-brand-50 rounded-full">
                            <ShieldAlert className="w-8 h-8 text-brand-600" />
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 text-center mb-4">
                        Before You Continue
                    </h2>

                    <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
                        <p>
                            This platform is a study <span className="font-semibold text-gray-900">reference</span>, not a source of graded-assignment solutions.
                            Using AI/LLM tools, or the linked material here, to directly complete assignments meant to be done yourself may violate your institution's academic integrity policy.
                        </p>
                        <p>
                            We strongly recommend you <span className="font-semibold text-gray-900">do not</span> use these links to solve graded work — use them only to cross-check your own understanding after attempting the problem in class. Solutions and concepts taught in class remain the primary and intended source of learning.
                        </p>
                        <p>
                            By clicking below, you confirm you understand this and will use nstBuddy responsibly.
                        </p>
                    </div>

                    <button
                        onClick={handleAcknowledge}
                        disabled={submitting}
                        className="w-full mt-6 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            'I Understand — Continue'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DisclaimerNotice;
