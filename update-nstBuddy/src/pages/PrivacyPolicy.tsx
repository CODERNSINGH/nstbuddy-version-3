import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
    return (
        <Layout>
            <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 mb-8">
                <ArrowLeft className="w-4 h-4" /> Back to nstBuddy
            </Link>

            <div className="max-w-3xl">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
                <p className="text-sm text-gray-400 mb-10">Last updated August 2026</p>

                <div className="space-y-8 text-gray-700 leading-relaxed">
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">What we collect</h2>
                        <p>
                            When you sign in with Google, we store your name, email address, and profile picture as
                            provided by Firebase Authentication. We do not see or store your Google password.
                        </p>
                        <p className="mt-2">
                            We also store content you choose to submit: contributed questions, community posts and
                            comments, and any group you create or join - including the contact details (phone,
                            WhatsApp, or email) you share when joining a group.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">How it's used</h2>
                        <p>
                            Your name and picture are shown alongside content you contribute so other students know
                            who to credit. Contact details you share when joining a group are visible only to that
                            group's admin and to you - never to other members or the public.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">What we don't do</h2>
                        <p>
                            We don't sell your data to third parties. We don't use your contributed content or
                            group contact information for advertising.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Your control</h2>
                        <p>
                            You can delete any post, comment, question, or group you created at any time from within
                            the app. To request full account deletion, reach out using the contact below.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Contact</h2>
                        <p>
                            Questions about this policy? Reach out to{' '}
                            <a
                                href="https://linkedin.com/in/codernsingh"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-600 hover:text-brand-700 underline"
                            >
                                Narendra Singh
                            </a>, who built and maintains nstBuddy.
                        </p>
                    </section>
                </div>
            </div>
        </Layout>
    );
};

export default PrivacyPolicy;
