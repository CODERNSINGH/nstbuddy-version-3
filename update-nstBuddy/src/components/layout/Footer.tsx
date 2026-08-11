import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-t border-gray-200 mt-auto py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <Link to="/" className="flex items-center space-x-2">
                    <img
                        src="/nstbuddy logo.png"
                        alt="NST Buddy"
                        className="h-7 w-auto grayscale opacity-80"
                    />
                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">2.0</span>
                </Link>
                <p className="text-xs text-gray-400 font-medium">
                    © 2026 NST Buddy. Made by NSTians, for NSTians.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
