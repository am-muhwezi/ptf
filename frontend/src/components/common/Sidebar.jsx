import React, { useState } from 'react';

const Sidebar = () => {
  const [activeItem, setActiveItem] = useState('Dashboard');

  const menuItems = [
    { name: 'Dashboard', icon: '/images/img_vector_0.svg', active: true },
    { name: 'Members', icon: '/images/img_vector_0_gray_900.svg', active: false },
    { name: 'Bookings', icon: '/images/img_vector_0_gray_900_24x24.svg', active: false },
    { name: 'Attendance', icon: '/images/img_vector_0_24x24.svg', active: false },
    { name: 'Feedback', icon: '/images/img_vector_0_1.svg', active: false },
    { name: 'Communication', icon: '/images/img_vector_0_2.svg', active: false },
    { name: 'Inventory', icon: '/images/img_vector_0_3.svg', active: false },
  ];

  const handleItemClick = (itemName) => {
    setActiveItem(itemName);
  };

  return (
    <aside className="w-80 bg-gray-50 h-screen p-6">
      <div className="mb-8">
        <h2 className="text-base font-medium text-gray-900">Paul's Tropical Fitness</h2>
        <p className="text-sm text-gray-600 mt-1">Front Office: Muhwezi</p>
      </div>
      
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <div
            key={item.name}
            onClick={() => handleItemClick(item.name)}
            className={`flex items-center px-3 py-2 rounded-2xl cursor-pointer transition-colors ${
              activeItem === item.name
                ? 'bg-gray-200' :'hover:bg-gray-100'
            }`}
          >
            <img
              src={item.icon}
              alt={`${item.name} icon`}
              className="w-6 h-6 mr-4"
            />
            <span className="text-sm font-medium text-gray-900">{item.name}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;