import React from 'react';

const Header = () => {
  return (
    <header className="bg-white border-b border-emerald-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900">Paul's Tropical Fitness</h1>
          <p className="text-sm text-emerald-600 mt-1">Dashboard - Overview of daily operations and key metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-2xl">🏝️</div>
          <div className="text-right">
            <div className="text-sm font-medium text-emerald-900">Welcome back!</div>
            <div className="text-xs text-emerald-600">Admin Dashboard</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;