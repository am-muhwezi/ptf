// components/common/ProtectedLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header'; // Adjust the import path as necessary

const ProtectedLayout = () => {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  );
};

export default ProtectedLayout;