import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ComingSoon from './pages/ComingSoon';
import Attendance from './pages/Attendance';
import Bookings from './pages/Bookings';


// Import page components
import DashboardPage from './pages/Dashboard';
import Members from './pages/Members';
import IndoorMemberships from './pages/Memberships/IndoorMemberships';
import OutdoorMemberships from './pages/Memberships/OutdoorMemberships';
import RenewalsDue from './pages/Memberships/RenewalsDue';
import PaymentsDue from './pages/Memberships/PaymentsDue';
import DesignShowcase from './pages/DesignShowcase';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardPage />} />4
        <Route path="/members" element={<Members />} />
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
        <Route path="*" element={<ComingSoon />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;