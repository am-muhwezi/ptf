import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import page components
import DashboardPage from './pages/Dashboard';
import IndoorMemberships from './pages/Memberships/IndoorMemberships';
import OutdoorMemberships from './pages/Memberships/OutdoorMemberships';
import RenewalsDue from './pages/Memberships/RenewalsDue';
import PaymentsDue from './pages/Memberships/PaymentsDue';
import Attendance from './pages/Attendance';
import Bookings from './pages/Bookings';
import ComingSoon from './pages/ComingSoon';
import DesignShowcase from './pages/DesignShowcase';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/design-showcase" element={<DesignShowcase />} />
        <Route path="/memberships/indoor" element={<IndoorMemberships />} />
        <Route path="/memberships/outdoor" element={<OutdoorMemberships />} />
        <Route path="/memberships/renewals" element={<RenewalsDue />} />
        <Route path="/memberships/payments" element={<PaymentsDue />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/feedback" element={<ComingSoon />} />
        <Route path="/communication" element={<ComingSoon />} />
        <Route path="/inventory" element={<ComingSoon />} />
        <Route path="/designs" element={<DesignShowcase />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;