import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { authAPI } from '../services/auth';

interface User {
    id: string;
    firebaseUid: string;
    email: string;
    name: string;
    picture?: string;
    isPro: boolean;
    isAdmin: boolean;
    disclaimerAcknowledgedAt: string | null;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);



    // Listen to Firebase auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {

            if (firebaseUser) {
                try {
                    // Get Firebase ID token
                    const idToken = await firebaseUser.getIdToken();

                    // Verify token with backend and get/create user
                    const response = await authAPI.verifyToken(idToken);

                    if (response.success && response.user) {
                        setUser(response.user);
                    } else {
                        setUser(null);
                    }
                } catch (error) {
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async () => {
        try {

            setLoading(true);

            // Use popup for local development
            const result = await signInWithPopup(auth, googleProvider);

            // onAuthStateChanged will handle the rest
        } catch (error: any) {
            // Handle specific errors
            if (error.code === 'auth/popup-blocked') {
                alert('Popup was blocked by your browser. Please allow popups for this site.');
            }

            setLoading(false);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            await authAPI.logout();
            setUser(null);
            window.location.href = '/login';
        } catch (error) {
            // Logout failed silently
        }
    };

    const refreshUser = async () => {
        const firebaseUser = auth.currentUser;
        if (firebaseUser) {
            try {
                const idToken = await firebaseUser.getIdToken(true); // Force refresh
                const response = await authAPI.verifyToken(idToken);
                if (response.success && response.user) {
                    setUser(response.user);
                }
            } catch (error) {
                // Error refreshing user silently
            }
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-50">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-600"></div>
                    <p className="text-gray-600 text-base animate-pulse font-medium">Please wait for 20-30 seconds...</p>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
