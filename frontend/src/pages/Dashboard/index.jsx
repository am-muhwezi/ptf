import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import Notifications from '../../components/ui/Notifications';
import RegisterMemberForm from '../../components/forms/RegisterMemberForm';
import CheckInForm from '../../components/forms/CheckInForm';
import { useApi } from '../../hooks/useApi';
import { dashboardService } from '../../services/dashboardService';
import { memberService } from '../../services/memberService';
import { useAuthContext } from '@/contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();

  const { user, isLoading } = useAuthContext();

  console.log('Dashboard user:', user);
  console.log('Dashboard - Auth context:', { user: user?.email, isLoading });

  // API hooks
  const { data: dashboardStats, loading: statsLoading, error: statsError } = useApi(dashboardService.getDashboardStats);
  const { data: notificationsData, loading: notificationsLoading } = useApi(dashboardService.getNotifications);

  const notifications = Array.isArray(notificationsData) ? notificationsData : [];

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal and Toast states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Default data structure for when API is loading or fails
  const defaultStats = {
    membershipData: {
      indoor: 0,
      outdoor: 0,
      renewalsDue: 0,
      paymentOverdue: 0
    },
    bookingData: {
      groupSessions: 0,
      oneOnOneSessions: 0,
      trainersAvailable: 0,
      waitlistRequests: 0
    },
    attendanceData: {
      indoorVisits: 0,
      outdoorVisits: 0
    },
    feedbackData: {
      openTickets: 0,
      avgResolutionTime: '0 days'
    },
    inventoryData: {
      availableStock: 0,
      lowStockAlerts: 0
    }
  };

  const stats = {
    ...defaultStats,
    ...dashboardStats,
    bookingData: {
      ...defaultStats.bookingData,
      ...(dashboardStats?.bookingData || {})
    },
    membershipData: {
      ...defaultStats.membershipData,
      ...(dashboardStats?.membershipData || {})
    },
    inventoryData: {
      ...defaultStats.inventoryData,
      ...(dashboardStats?.inventoryData || {})
    }
  };


  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  const handleRegisterMember = () => {
    setShowRegisterModal(true);
  };

  const handleCheckInMember = () => {
    setShowCheckInModal(true);
  };

  const handleRegisterSubmit = async (memberData) => {
    try {
      await memberService.createMember(memberData);
      setShowRegisterModal(false);
      showToast(`${memberData.first_name} ${memberData.last_name} registered successfully!`, 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

const handleCheckInSubmit = async (memberData) => {
  try {
    // Check-in is already handled by CheckInForm, just close modal and show success
    setShowCheckInModal(false);
    showToast(`${memberData.memberName} checked in successfully!`, 'success');
    
    // Optionally refresh dashboard stats after check-in
    // You could reload dashboard stats here if needed
    
  } catch (error) {
    showToast(error.message, 'error');
    throw error;
  }
};
  const handleCardClick = (cardType, value, route) => {
    if (route) {
      navigate(route);
    } else {
      showToast(`${cardType}: ${value} - Detailed view would be implemented here`, 'info');
    }
  };

  // Loading state
  if (statsLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse space-y-8">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded"></div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Error state
  if (statsError) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Dashboard</h3>
                <p className="text-red-600">{statsError}</p>
                <Button 
                  variant="primary" 
                  onClick={() => window.location.reload()}
                  className="mt-4"
                >
                  Retry
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-emerald-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            {/* Quick Actions */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-emerald-900 mb-4">Quick Actions</h2>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button 
                  variant="primary" 
                  onClick={handleRegisterMember}
                  className="w-full sm:w-auto px-4 py-3 bg-emerald-500 hover:bg-emerald-600"
                >
                  Register New Member
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={handleCheckInMember}
                  className="w-full sm:w-auto px-4 py-3"
                >
                  Check-in Member
                </Button>
                {user?.is_superuser && (
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/admin/users')}
                    className="w-full sm:w-auto px-4 py-3 border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                  >
                    Admin Management
                  </Button>
                )}
              </div>
            </section>

            {/* Membership Management */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-emerald-900 mb-4 sm:mb-6">Membership Management</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card
                  title="Indoor Memberships"
                  value={stats.membershipData?.indoor ?? 0}
                  onClick={() => handleCardClick('Indoor Memberships', stats.membershipData?.indoor ?? 0, '/memberships/indoor')}
                />
                <Card
                  title="Outdoor Memberships"
                  value={stats.membershipData?.outdoor ?? 0}
                  onClick={() => handleCardClick('Outdoor Memberships', stats.membershipData?.outdoor ?? 0, '/memberships/outdoor')}
                />
                <Card
                  title="Renewals Due"
                  value={stats.membershipData?.renewalsDue ?? 0}
                  onClick={() => handleCardClick('Renewals Due', stats.membershipData?.renewalsDue ?? 0, '/memberships/renewals')}
                />
                <Card
                  title="Payment Overdue"
                  value={stats.membershipData?.paymentOverdue ?? 0}
                  onClick={() => handleCardClick('Payment Overdue', stats.membershipData?.paymentOverdue ?? 0, '/memberships/payments')}
                />
              </div>
            </section>

            {/* Bookings */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-emerald-900 mb-4 sm:mb-6">Bookings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card
                  title="Group Sessions Today"
                  value={stats.bookingData.groupSessions}
                  onClick={() => handleCardClick('Group Sessions Today', stats.bookingData.groupSessions)}
                />
                <Card
                  title="One-on-One Sessions Today"
                  value={stats.bookingData.oneOnOneSessions}
                  onClick={() => handleCardClick('One-on-One Sessions Today', stats.bookingData.oneOnOneSessions)}
                />
                <Card
                  title="Trainers Available"
                  value={stats.bookingData.trainersAvailable}
                  onClick={() => handleCardClick('Trainers Available', stats.bookingData.trainersAvailable)}
                />
                <Card
                  title="Waitlist Requests"
                  value={stats.bookingData.waitlistRequests}
                  onClick={() => handleCardClick('Waitlist Requests', stats.bookingData.waitlistRequests)}
                />
              </div>
            </section>

            {/* Attendance Logs */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-emerald-900 mb-4 sm:mb-6">Attendance Logs</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Card
                  title="Indoor Visits Today"
                  value={stats?.attendanceData?.indoorVisits || 0}
                  onClick={() => handleCardClick('Indoor Visits Today', stats.attendanceData.indoorVisits)}
                />
                <Card
                  title="Outdoor Visits Today"
                  value={stats?.attendanceData?.outdoorVisits || 0}
                  onClick={() => handleCardClick('Outdoor Visits Today', stats.attendanceData.outdoorVisits)}
                />
              </div>
            </section>

            {/* Complaints & Feedback */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-emerald-900 mb-4 sm:mb-6">Complaints & Feedback</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Card
                  title="Open Tickets"
                  value={stats?.feedbackData?.openTickets || 0}
                  onClick={() => handleCardClick('Open Tickets', stats.feedbackData.openTickets)}
                />
                <Card
                  title="Average Resolution Time"
                  value={stats?.feedbackData?.avgResolutionTime || '0 days'}
                  onClick={() => handleCardClick('Average Resolution Time', stats.feedbackData.avgResolutionTime)}
                />
              </div>
            </section>

            {/* Communication & Alerts */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-emerald-900 mb-4 sm:mb-6">Communication & Alerts</h2>
              {notificationsLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <Notifications notifications={notifications} />
              )}
            </section>

            {/* Inventory & Merchandise */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-emerald-900 mb-4 sm:mb-6">Inventory & Merchandise</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Card
                  title="Available Stock Levels"
                  value={stats?.inventoryData?.availableStock || 0}
                  onClick={() => handleCardClick('Available Stock Levels', stats.inventoryData.availableStock)}
                />
                <Card
                  title="Low Stock Alerts"
                  value={stats?.inventoryData?.lowStockAlerts || 0}
                  onClick={() => handleCardClick('Low Stock Alerts', stats.inventoryData.lowStockAlerts)}
                />
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Register Member Modal */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        size="large"
      >
        <RegisterMemberForm
          onSubmit={handleRegisterSubmit}
          onCancel={() => setShowRegisterModal(false)}
        />
      </Modal>

      {/* Check-in Member Modal */}
      <Modal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        size="medium"
      >
        <CheckInForm
          onSubmit={handleCheckInSubmit}
          onCancel={() => setShowCheckInModal(false)}
        />
      </Modal>

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={hideToast}
      />
    </div>
  );
};

export default Dashboard;