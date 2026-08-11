import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, LogOut, Crown, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserProfile: React.FC = () => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
                {user.picture ? (
                    <img
                        src={user.picture}
                        alt={user.name}
                        className="w-8 h-8 rounded-full border-2 border-gray-200"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                )}
                <span className="hidden md:block text-sm font-medium text-gray-700">
                    {user.name}
                </span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            {user.picture ? (
                                <img
                                    src={user.picture}
                                    alt={user.name}
                                    className="w-12 h-12 rounded-full border-2 border-gray-200"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold text-lg">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-2">
                            {user.isPro && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-semibold rounded-full">
                                    <Crown className="w-3 h-3" />
                                    Pro
                                </span>
                            )}
                            {user.isAdmin && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-semibold rounded-full">
                                    <Shield className="w-3 h-3" />
                                    Admin
                                </span>
                            )}
                        </div>
                    </div>

                    <Link
                        to="/profile"
                        className="px-4 py-2 text-left text-sm text-black hover:bg-gray-100 font-medium flex items-center gap-1"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                    </Link>

                    <button
                        onClick={() => {
                            setIsOpen(false);
                            logout();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
