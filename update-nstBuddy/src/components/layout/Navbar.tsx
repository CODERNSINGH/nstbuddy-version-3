import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import UserProfile from '../auth/UserProfile';
import GlobalSearch from './GlobalSearch';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const navLinks = [
    { name: 'Campuses', path: '/' },
    { name: 'Contribute', path: '/contribute' },
    { name: 'Community', path: '/community', tag: 'New' },
    { name: 'Groups', path: '/groups', tag: 'New' },
    { name: 'Profile', path: '/profile' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left - Logo */}
          <Link to="/" className="flex items-center space-x-2 shrink-0">
            <img
              src="/nstbuddy logo.png"
              alt="NST Buddy"
              className="h-7 w-auto"
            />
            <span className="text-[10px] bg-brand-600 text-white px-2 py-0.5 rounded-full font-bold">2.0</span>
          </Link>

          {/* Center - Navigation Links */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-1.5 text-sm font-semibold transition-colors relative py-5 ${
                  isActive(link.path) ? 'text-brand-600' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {link.name}
                {link.tag && (
                  <span className="text-[9px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full font-bold leading-none">
                    {link.tag}
                  </span>
                )}
                {isActive(link.path) && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600 rounded-t-full"></span>
                )}
              </Link>
            ))}
            {user?.isAdmin && (
              <Link
                to="/admin/dashboard"
                className="text-sm font-semibold text-purple-600 hover:text-purple-700 py-5"
              >
                Admin
              </Link>
            )}
          </div>

          {/* Right - Search, Profile */}
          <div className="flex items-center space-x-4 shrink-0">
            <GlobalSearch />
            <UserProfile />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

