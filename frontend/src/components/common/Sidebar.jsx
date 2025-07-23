import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState(location.pathname);

  const menuItems = [
    { name: 'Dashboard', icon: '/images/img_vector_0.svg', path: '/' },
    { 
      name: 'Memberships', 
      icon: '/images/img_vector_0_gray_900.svg', 
      path: '/members',
      subItems: [
        { name: 'Indoor Memberships', path: '/memberships/indoor' },
        { name: 'Outdoor Memberships', path: '/memberships/outdoor' },
        { name: 'Renewals Due', path: '/memberships/renewals' },
        { name: 'Payments Due', path: '/memberships/payments' }
      ]
    },
    { name: 'Bookings', icon: '/images/img_vector_0_gray_900_24x24.svg', path: '/bookings' },
    { name: 'Attendance', icon: '/images/img_vector_0_24x24.svg', path: '/attendance' },
    { name: 'Feedback', icon: '/images/img_vector_0_1.svg', path: '/feedback' },
    { name: 'Communication', icon: '/images/img_vector_0_2.svg', path: '/communication' },
    { name: 'Inventory', icon: '/images/img_vector_0_3.svg', path: '/inventory' },
  ];

  const handleItemClick = (item) => {
    if (item.subItems) {
      // Toggle submenu for items with subitems
      setActiveItem(activeItem === item.path ? '' : item.path);
    } else {
      setActiveItem(item.path);
      navigate(item.path);
    }
  };

  const handleSubItemClick = (subItem) => {
    setActiveItem(subItem.path);
    navigate(subItem.path);
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
    <aside className="w-80 bg-gray-50 h-screen p-6 overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-base font-medium text-gray-900">Paul's Tropical Fitness</h2>
        <p className="text-sm text-gray-600 mt-1">Front Office: Muhwezi</p>
      </div>
      
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <div key={item.name}>
            <div
              onClick={() => handleItemClick(item)}
              className={`flex items-center px-3 py-2 rounded-2xl cursor-pointer transition-colors ${
                isActive(item.path) || isParentActive(item) || activeItem === item.path
                  ? 'bg-gray-200' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <img
                src={item.icon}
                alt={`${item.name} icon`}
                className="w-6 h-6 mr-4"
              />
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
              <div className="ml-10 mt-2 space-y-1">
                {item.subItems.map((subItem) => (
                  <div
                    key={subItem.name}
                    onClick={() => handleSubItemClick(subItem)}
                    className={`px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                      isActive(subItem.path)
                        ? 'bg-blue-100 text-blue-800 font-medium'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {subItem.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;