import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import NotificationBell from '../notifications/NotificationBell';

const Header = ({ onMenuClick }) => {
  const { user, logout, isLoading } = useAuthContext();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setShowUserMenu(false);
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const firstInitial = user.firstName?.charAt(0) || user.email?.charAt(0) || 'U';
    const lastInitial = user.lastName?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  const getUserDisplayName = () => {
    if (!user) return 'User';
    if (user.firstName && user.lastName) {
      // Debug logging only in development
      if (import.meta.env.MODE === 'development' && import.meta.env.VITE_DEBUG_AUTH === 'true') {
        console.log('Header user:', user);
      }
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || 'User';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex justify-between items-center px-4 sm:px-6 py-4">
        {/* Left side - Mobile menu button and title */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
            Paul's Tropical Fitness
          </h1>
        </div>

        {/* Right side - user menu */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Notifications - Hidden on very small screens */}
          <div className="hidden sm:block">
            <NotificationBell />
          </div>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={isLoading}
            >
              {/* User Avatar */}
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {getUserInitials()}
              </div>
              
              {/* User Info - Hidden on very small screens */}
              <div className="text-left hidden sm:block">
                <div className="text-sm font-medium text-gray-800">
                  {getUserDisplayName()}
                </div>
                <div className="text-xs text-gray-500">
                  {user?.email || ''}
                </div>
              </div>

              {/* Dropdown Arrow */}
              <svg
                className={`w-4 h-4 text-gray-600 transition-transform ${
                  showUserMenu ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 sm:w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-medium">
                      {getUserInitials()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {getUserDisplayName()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user?.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>View Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // Navigate to settings when implemented
                      console.log('Navigate to settings');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Settings</span>
                  </button>

                  <div className="border-t border-gray-100 my-2"></div>

                  <button
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>{isLoading ? 'Signing out...' : 'Sign out'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;