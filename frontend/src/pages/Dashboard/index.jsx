import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import RegisterMemberForm from '../../components/forms/RegisterMemberForm';
import CheckInForm from '../../components/forms/CheckInForm';
import { dashboardService } from '../../services/dashboardService';
import { memberService } from '../../services/memberService';
import { useAuthContext } from '@/contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();

  const { user, isLoading } = useAuthContext();


  // Data state
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Cleanup ref
  const abortControllerRef = useRef(null);

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal and Toast states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // ✅ Unified useEffect pattern - Load dashboard statistics
  useEffect(() => {
    const loadData = async () => {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        setStatsLoading(true);
        setStatsError(null);

        const response = await dashboardService.getAll();

        // Only update state if request wasn't aborted
        if (!abortControllerRef.current?.signal.aborted) {
          if (response.success) {
            setDashboardStats(response.stats);
          }
        }
      } catch (error) {
        // Only handle error if request wasn't aborted
        if (!abortControllerRef.current?.signal.aborted) {
          setStatsError(error.message);
        }
      } finally {
        // Only update loading state if request wasn't aborted
        if (!abortControllerRef.current?.signal.aborted) {
          setStatsLoading(false);
        }
      }
    };

    loadData();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [refreshTrigger]); // Only depend on refreshTrigger

  // Transform backend data structure to frontend format
  const transformStats = (backendStats) => {
    if (!backendStats) return null;

    // Backend now returns simplified structure with only membership stats
    return {
      membershipData: {
        indoor: backendStats.memberships?.indoor_count || 0,
        outdoor: backendStats.memberships?.outdoor_count || 0,
        renewalsDue: backendStats.memberships?.expiring_soon || 0,
        paymentOverdue: backendStats.memberships?.overdue_payment || 0,
        pendingPayment: backendStats.memberships?.pending_payment || 0
      }
    };
  };

  // Default data structure for when API is loading or fails
  const defaultStats = {
    membershipData: {
      indoor: 0,
      outdoor: 0,
      renewalsDue: 0,
      paymentOverdue: 0,
      pendingPayment: 0
    }
  };

  const stats = transformStats(dashboardStats) || defaultStats;


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
      
      // Refresh dashboard data after successful registration
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleCheckInSubmit = async (memberData) => {
    try {
      setShowCheckInModal(false);
      showToast(`${memberData.memberName} checked in successfully!`, 'success');
      
      // Refresh dashboard data after successful check-in
      setRefreshTrigger(prev => prev + 1);
      
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                <Card
                  title="All Members"
                  value={stats.membershipData?.indoor + stats.membershipData?.outdoor || 0}
                  onClick={() => handleCardClick('All Members', stats.membershipData?.indoor + stats.membershipData?.outdoor || 0, '/members')}
                />
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