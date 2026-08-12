import React from 'react';
import { Link } from 'react-router-dom';

const productLinks = [
    { name: 'Campuses', path: '/' },
    { name: 'Contribute', path: '/contribute' },
    { name: 'Community', path: '/community' },
    { name: 'Groups', path: '/groups' },
];

const accountLinks = [
    { name: 'Profile', path: '/profile' },
    { name: 'Privacy Policy', path: '/privacy' },
];

const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-t border-gray-100 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-3">
                            <img src="/nstbuddy logo.png" alt="NST Buddy" className="h-7 w-auto" />
                            <span className="text-[10px] bg-brand-600 text-white px-2 py-0.5 rounded-full font-bold">2.0</span>
                        </Link>
                        <p className="text-sm text-gray-500 max-w-xs">
                            Questions, community, and teammates for Newton School students - built by students, for students.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Product</h4>
                        <ul className="space-y-2.5">
                            {productLinks.map((link) => (
                                <li key={link.path}>
                                    <Link to={link.path} className="text-sm text-gray-600 hover:text-brand-600 transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Account</h4>
                        <ul className="space-y-2.5">
                            {accountLinks.map((link) => (
                                <li key={link.path}>
                                    <Link to={link.path} className="text-sm text-gray-600 hover:text-brand-600 transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-6 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                        © {new Date().getFullYear()} nstBuddy. Made by NSTians, for NSTians.
                    </p>
                    <p className="text-xs text-gray-400">
                        Built by{' '}
                        <a
                            href="https://linkedin.com/in/codernsingh"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-gray-600 hover:text-brand-600 transition-colors"
                        >
                            Narendra Singh
                        </a>
                    </p>
                </div>
            </div>

            <div className="overflow-hidden select-none pointer-events-none">
                <h2 className="text-center font-black text-[18vw] sm:text-[14vw] leading-none tracking-tighter text-gray-900/[0.04] -mb-[3vw] sm:-mb-[2vw]">
                    NSTBUDDY
                </h2>
            </div>
        </footer>
    );
};

export default Footer;
