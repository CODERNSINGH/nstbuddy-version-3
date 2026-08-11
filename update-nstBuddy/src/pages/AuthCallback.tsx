import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { refreshUser } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            const success = searchParams.get('success');
            const error = searchParams.get('error');

            if (error) {
                // Authentication failed
                navigate('/login?error=' + error);
                return;
            }

            if (success) {
                // Refresh user data
                await refreshUser();

                // Redirect to home or the page they were trying to access
                const from = sessionStorage.getItem('authRedirect') || '/';
                sessionStorage.removeItem('authRedirect');
                navigate(from);
            } else {
                // No success or error parameter, redirect to login
                navigate('/login');
            }
        };

        handleCallback();
    }, [searchParams, navigate, refreshUser]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <LoadingSpinner />
                <p className="mt-4 text-gray-600">Completing sign in...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
