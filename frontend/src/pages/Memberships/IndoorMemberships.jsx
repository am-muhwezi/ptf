import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import UpdateMemberProfileForm from '../../components/forms/UpdateMemberProfileForm';
import authService from '../../services/authService';

const IndoorMemberships = () => {
  const [allMembers, setAllMembers] = useState([]);
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total_memberships: 0,
    active_memberships: 0,
    expiring_soon: 0,
    new_this_month: 0,
    total_revenue: 0,
    sessions_used_today: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Load all indoor memberships from API (for stats)
  const loadAllIndoorMembers = async () => {
    try {
      const response = await authService.getIndoorMembers({
        page: 1,
        limit: 1000
      });
      
      if (response.success) {
        const transformedMembers = response.data.map(transformMemberData);
        setAllMembers(transformedMembers);
      }
    } catch (err) {
      console.error('Failed to load all indoor members for stats:', err);
    }
  };

  // Load indoor memberships from API (for display)
  const loadIndoorMembers = async (page = 1, updateLoading = false) => {
    try {
      if (updateLoading) {
        setLoading(true);
      }
      setError(null);
      
      const response = await authService.getIndoorMembers({
        search: searchTerm,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        page: page,
        limit: 20
      });
      
      if (response.success) {
        // const transformedMembers = response.data.map(transformMemberData);
        const transformedMembers = response.data;

        setMembers(transformedMembers);
        
        // Handle pagination
        setCurrentPage(page);
        setHasNext(!!response.next);
        setHasPrevious(!!response.previous);
        
        // Calculate total pages from count
        if (response.count) {
          setTotalPages(Math.ceil(response.count / 20));
        }
      } else {
        throw new Error('Failed to load indoor memberships');
      }
    } catch (err) {
      setError(err.message);
      showToast('Error loading indoor memberships: ' + err.message, 'error');
    } finally {
      if (updateLoading) {
        setLoading(false);
      }
    }
  };

  // Load membership statistics
  const loadStats = async () => {
    try {
      const response = await authService.getIndoorMembershipStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadAllIndoorMembers(),
          loadIndoorMembers(),
          loadStats()
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Reload data when search term or filter changes
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm || filterStatus !== 'all') {
        setCurrentPage(1); // Reset to first page
        loadIndoorMembers(1, true); // Enable loading state for search
      }
    }, 300); // Debounce search

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, filterStatus]);

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      loadIndoorMembers(newPage, true); // Enable loading state for pagination
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  const handleViewMember = (member) => {
    setSelectedMember(member);
    setShowMemberModal(true);
  };

  const handleRenewMembership = async (memberId) => {
    // TODO: Implement renewal functionality when backend endpoint is ready
    showToast(`Membership renewal initiated for member ${memberId}`, 'success');
  };

  const handleSuspendMember = async (memberId) => {
    // TODO: Implement suspend functionality when backend endpoint is ready
    showToast(`Member ${memberId} has been suspended`, 'warning');
  };

  const handleUpdateMemberProfile = async (updatedData) => {
    try {
      // Update the selected member with new data
      const updatedMember = { ...selectedMember, ...updatedData };
      
      // Update the members array
      const updatedMembers = members.map(member => 
        member.id === selectedMember.id ? updatedMember : member
      );
      
      setMembers(updatedMembers);
      setSelectedMember(updatedMember);
      setShowUpdateModal(false);
      
      showToast(`Profile updated successfully for ${selectedMember.firstName} ${selectedMember.lastName}`, 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  // Transform API data to match component expectations (indoor-specific)
  const transformMemberData = (apiMembership) => {
    return {
      id: apiMembership.member_id_display || `PTF${String(apiMembership.member).padStart(6, '0')}`,
      membershipId: apiMembership.id,
      firstName: apiMembership.member_name?.split(' ')[0] || 'N/A',
      lastName: apiMembership.member_name?.split(' ').slice(1).join(' ') || '',
      email: apiMembership.member_email,
      phone: apiMembership.member_phone,
      membershipType: 'indoor',
      status: apiMembership.status,
      joinDate: apiMembership.start_date,
      expiryDate: apiMembership.end_date,
      lastVisit: apiMembership.last_visit,
      totalVisits: apiMembership.total_visits || 0,
      planType: apiMembership.plan_name,
      amount: apiMembership.monthly_fee,
      paymentStatus: apiMembership.payment_status,
      // Health/fitness data
      height: apiMembership.height,
      weight: apiMembership.weight,
      bmi: apiMembership.bmi,
      bodyFatPercentage: apiMembership.body_fat_percentage,
      fitnessLevel: apiMembership.fitness_level,
      shortTermGoals: apiMembership.short_term_goals,
      longTermGoals: apiMembership.long_term_goals,
      strengthTestResults: apiMembership.strength_test_results,
      cardioTestResults: apiMembership.cardio_test_results,
      flexibilityTestResults: apiMembership.flexibility_test_results,
      isExpiringSoon: apiMembership.is_expiring_soon
    };
  };

  const isExpiringSoon = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      suspended: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusStyles = {
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const getFitnessLevelBadge = (level) => {
    const levelStyles = {
      beginner: 'bg-yellow-100 text-yellow-800',
      intermediate: 'bg-blue-100 text-blue-800',
      advanced: 'bg-green-100 text-green-800',
      athlete: 'bg-purple-100 text-purple-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${levelStyles[level] || 'bg-gray-100 text-gray-800'}`}>
        {level ? level.charAt(0).toUpperCase() + level.slice(1) : 'Not Set'}
      </span>
    );
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return { label: 'Not Available', style: 'bg-gray-100 text-gray-800' };
    const bmiValue = parseFloat(bmi);
    if (bmiValue < 18.5) return { label: 'Underweight', style: 'bg-yellow-100 text-yellow-800' };
    if (bmiValue < 25) return { label: 'Normal', style: 'bg-green-100 text-green-800' };
    if (bmiValue < 30) return { label: 'Overweight', style: 'bg-orange-100 text-orange-800' };
    return { label: 'Obese', style: 'bg-red-100 text-red-800' };
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded"></div>
                  ))}
                </div>
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Data</h3>
                <p className="text-red-600">{error}</p>
                <Button 
                  variant="primary" 
                  onClick={refetch}
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
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Indoor Memberships</h1>
                <p className="text-gray-600 mt-1">Manage indoor gym memberships and member details</p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline">Export Data</Button>
                <Button variant="primary">Add New Member</Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card
                title="Total Indoor Members"
                value={allMembers.length}
                subtitle="Active memberships"
              />
              <Card
                title="Active Members"
                value={allMembers.filter(m => m.status === 'active').length}
                subtitle="Currently active"
              />
              <Card
                title="Expiring Soon"
                value={allMembers.filter(m => isExpiringSoon(m.expiryDate)).length}
                subtitle="Within 30 days"
              />
              <Card
                title="Monthly Revenue"
                value={formatCurrency(allMembers.reduce((sum, m) => sum + (m.status === 'active' ? m.amount : 0), 0))}
                subtitle="From indoor memberships"
              />
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex space-x-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expiry Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Visit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {members.length === 0 && !loading && (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                          No indoor members found
                        </td>
                      </tr>
                    )}
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {member.first_name} {member.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{member.email}</div>
                            <div className="text-xs text-gray-400">{member.id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{member.planType}</div>
                          <div className="text-sm text-gray-500">{formatCurrency(member.amount)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(member.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(member.expiryDate)}</div>
                          {isExpiringSoon(member.expiryDate) && (
                            <div className="text-xs text-orange-600 font-medium">Expiring Soon</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPaymentStatusBadge(member.paymentStatus)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(member.lastVisit)}</div>
                          <div className="text-xs text-gray-500">{member.totalVisits} visits</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleViewMember(member)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleRenewMembership(member.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Renew
                          </button>
                          <button
                            onClick={() => handleSuspendMember(member.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Suspend
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Member Details Modal */}
      <Modal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        title="Member Details"
        size="large"
      >
        {selectedMember && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-sm text-gray-900">{selectedMember.firstName} {selectedMember.lastName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm text-gray-900">{selectedMember.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-sm text-gray-900">{selectedMember.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Member ID</label>
                    <p className="text-sm text-gray-900">{selectedMember.id}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Membership Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Plan Type</label>
                    <p className="text-sm text-gray-900">{selectedMember.planType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedMember.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Join Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedMember.joinDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Expiry Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedMember.expiryDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Amount</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedMember.amount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Status</label>
                    <div className="mt-1">{getPaymentStatusBadge(selectedMember.paymentStatus)}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Health Analysis Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Health Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedMember.height ? `${selectedMember.height} cm` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Height</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedMember.weight ? `${selectedMember.weight} kg` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Weight</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedMember.bmi || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">BMI</div>
                  {selectedMember.bmi && (
                    <div className="mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBMICategory(selectedMember.bmi).style}`}>
                        {getBMICategory(selectedMember.bmi).label}
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedMember.bodyFatPercentage ? `${selectedMember.bodyFatPercentage}%` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Body Fat</div>
                </div>
              </div>
            </div>

            {/* Fitness Level & Test Results */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Fitness Assessment</h3>
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-500">Fitness Level</label>
                <div className="mt-1">{getFitnessLevelBadge(selectedMember.fitnessLevel)}</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Strength Test Results</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {selectedMember.strengthTestResults || 'No data available'}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Cardio Test Results</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {selectedMember.cardioTestResults || 'No data available'}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Flexibility Test Results</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {selectedMember.flexibilityTestResults || 'No data available'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Goals Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Fitness Goals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Short-term Goals (3-6 months)</label>
                  <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      {selectedMember.shortTermGoals || 'No goals set yet'}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Long-term Goals (6+ months)</label>
                  <div className="mt-1 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-900">
                      {selectedMember.longTermGoals || 'No goals set yet'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">{selectedMember.totalVisits}</div>
                  <div className="text-sm text-gray-600">Total Visits</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">{formatDate(selectedMember.lastVisit)}</div>
                  <div className="text-sm text-gray-600">Last Visit</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.ceil((new Date(selectedMember.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))}
                  </div>
                  <div className="text-sm text-gray-600">Days Remaining</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowUpdateModal(true)}
              >
                Edit Profile
              </Button>
              <Button
                variant="primary"
                onClick={() => handleRenewMembership(selectedMember.id)}
              >
                Renew Membership
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Update Member Profile Modal */}
      <Modal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        title="Update Member Profile"
        size="full"
      >
        <UpdateMemberProfileForm
          initialData={selectedMember}
          onSubmit={handleUpdateMemberProfile}
          onCancel={() => setShowUpdateModal(false)}
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

export default IndoorMemberships;