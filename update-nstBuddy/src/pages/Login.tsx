import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Login: React.FC = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect to home if already logged in
    useEffect(() => {
        if (!loading && user) {
            // Get the page they were trying to visit, or default to home
            const from = (location.state as any)?.from?.pathname || '/';
            navigate(from, { replace: true });
        }
    }, [user, loading, navigate, location]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    // Don't show login page if user is already authenticated
    if (user) {
        return null;
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-white overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-100/60 via-transparent to-transparent -z-10"></div>
            <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-brand-50/50 via-transparent to-transparent -z-10"></div>

            <div className="max-w-md w-full mx-4">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
                    {/* Logo/Brand */}
                    <div className="mb-8">
                        <img src="/nstbuddy logo.png" alt="NST Buddy" className="h-12 w-auto mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            NST Buddy
                        </h1>
                        <p className="text-gray-500 text-lg">
                            Your academic companion
                        </p>
                    </div>

                    {/* Welcome Message */}
                    <div className="mb-10">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                            Welcome!
                        </h2>
                        <p className="text-gray-600">
                            Sign in to continue
                        </p>
                    </div>

                    {/* Google Sign In Button */}
                    <div className="flex justify-center">
                        <GoogleSignInButton />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
