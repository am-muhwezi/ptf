import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState(location.pathname);
  const { user } = useAuthContext();

  // Icon component for rendering SVG icons
  const Icon = ({ name, className = "w-6 h-6" }) => {
    const icons = {
      dashboard: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v10m8-10v10" />
        </svg>
      ),
      users: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      analytics: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      admin: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      calendar: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      checklist: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      chat: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      message: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
      inventory: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      members: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      indoor: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0v4M8 11h8" />
        </svg>
      ),
      outdoor: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      ),
      renewals: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      payments: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    };

    return icons[name] || icons.dashboard;
  };

  const menuItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/' },
    {
      name: 'Memberships',
      icon: 'users',
      path: '/memberships',
      subItems: [
        { name: 'All Members', path: '/members', icon: 'members' },
        { name: 'Indoor Memberships', path: '/memberships/indoor', icon: 'indoor' },
        { name: 'Outdoor Memberships', path: '/memberships/outdoor', icon: 'outdoor' },
        { name: 'Renewals Due', path: '/memberships/renewals', icon: 'renewals' },
        { name: 'Payments Due', path: '/memberships/payments', icon: 'payments' }
      ]
    },
    { name: 'Bookings', icon: 'calendar', path: '/bookings' },
    { name: 'Attendance', icon: 'checklist', path: '/attendance' },
  ];

  // Admin-only menu items (only visible to superusers)
  const adminMenuItems = (user?.is_superuser || user?.isSuperuser) ? [
    { name: 'Analytics', icon: 'analytics', path: '/analytics' },
    { name: 'Admin Management', icon: 'admin', path: '/admin-qmM4tN7nm3ybf9S' },
  ] : [];

  // Debug: Log user permissions
  console.log('Current user:', user);
  console.log('User is_staff:', user?.is_staff, 'User isStaff:', user?.isStaff);
  console.log('User is_superuser:', user?.is_superuser, 'User isSuperuser:', user?.isSuperuser);

  const allMenuItems = [...menuItems, ...adminMenuItems];

  const handleItemClick = (item) => {
    if (item.subItems) {
      // Toggle submenu for items with subitems
      setActiveItem(activeItem === item.path ? '' : item.path);
    } else {
      setActiveItem(item.path);
      navigate(item.path);
      // Close mobile sidebar after navigation
      if (onClose) onClose();
    }
  };

  const handleSubItemClick = (subItem) => {
    setActiveItem(subItem.path);
    navigate(subItem.path);
    // Close mobile sidebar after navigation
    if (onClose) onClose();
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const isParentActive = (item) => {
    if (item.subItems) {
      return item.subItems.some(subItem => location.pathname === subItem.path);
    }
    return false;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-80 bg-gray-50 h-screen p-6 overflow-y-auto
        transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transition-transform duration-300 ease-in-out
      `}>
        {/* Mobile close button */}
        <div className="flex items-center justify-between mb-8 lg:block">
          <div>
            <h2 className="text-base font-medium text-gray-900">Paul's Tropical Fitness</h2>
            <p className="text-sm text-gray-600">The fitness journey starts here</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      
      <nav className="space-y-2">
        {allMenuItems.map((item) => (
          <div key={item.name}>
            <div
              onClick={() => handleItemClick(item)}
              className={`flex items-center px-3 py-2 rounded-2xl cursor-pointer transition-colors ${
                isActive(item.path) || isParentActive(item) || activeItem === item.path
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="mr-4">
                <Icon name={item.icon} className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-900 flex-1">{item.name}</span>
              {item.subItems && (
                <svg 
                  className={`w-4 h-4 transition-transform ${
                    activeItem === item.path || isParentActive(item) ? 'rotate-90' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
            
            {/* Submenu */}
            {item.subItems && (activeItem === item.path || isParentActive(item)) && (
              <div className="ml-6 mt-2 space-y-1">
                {item.subItems.map((subItem) => (
                  <div
                    key={subItem.name}
                    onClick={() => handleSubItemClick(subItem)}
                    className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                      isActive(subItem.path)
                        ? 'bg-emerald-100 text-emerald-800 font-medium'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {subItem.icon && (
                      <div className="mr-3">
                        <Icon name={subItem.icon} className="w-4 h-4" />
                      </div>
                    )}
                    {subItem.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      </aside>
    </>
  );
};

export default Sidebar;