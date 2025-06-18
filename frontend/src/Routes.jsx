import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import page components
import DashboardPage from './pages/Dashboard';
import IndoorMemberships from './pages/Memberships/IndoorMemberships';
import OutdoorMemberships from './pages/Memberships/OutdoorMemberships';
import RenewalsDue from './pages/Memberships/RenewalsDue';
import PaymentsDue from './pages/Memberships/PaymentsDue';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/memberships/indoor" element={<IndoorMemberships />} />
        <Route path="/memberships/outdoor" element={<OutdoorMemberships />} />
        <Route path="/memberships/renewals" element={<RenewalsDue />} />
        <Route path="/memberships/payments" element={<PaymentsDue />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;