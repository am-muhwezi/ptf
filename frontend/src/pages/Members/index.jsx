// frontend/src/pages/Members/index.jsx
import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import PaymentForm from '../../components/forms/PaymentForm';
import Receipt from '../../components/ui/Receipt';
import PaymentReminder from '../../components/ui/PaymentReminder';
import RegisterMemberForm from '../../components/forms/RegisterMemberForm';
import UpdateMemberProfileForm from '../../components/forms/UpdateMemberProfileForm';
import { memberService } from '../../services/memberService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const Members = () => {
  // State management
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total_members: 0,
    active_members: 0,
    inactive_members: 0,
    indoor_members: 0,
    outdoor_members: 0
  });
  
  // Cleanup ref for AbortController
  const abortControllerRef = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMembershipType, setFilterMembershipType] = useState('all');
  
  // Refresh trigger for post-operation updates
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal states
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });


  // Helper function to safely get member names
  const getMemberDisplayName = (member) => {
    if (!member) return '';
    return member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim();
  };

  // Helper function to safely get member initials
  const getMemberInitials = (member) => {
    if (!member) return '';
    const firstInitial = member.first_name?.charAt(0) || '';
    const lastInitial = member.last_name?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`;
  };

  // ✅ Unified useEffect pattern - Load members data and calculate stats in one coordinated approach
  useEffect(() => {
    const loadData = async () => {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);

        // Prepare member params for paginated display
        const memberParams = { 
          page: currentPage,
          limit: pageSize
        };
        if (searchTerm && searchTerm.trim() !== '') memberParams.q = searchTerm;
        if (filterStatus !== 'all') memberParams.status = filterStatus;

        // Make single API call for both display and stats calculation
        const response = await memberService.getMembers(memberParams);

        // Only update state if request wasn't aborted
        if (!abortControllerRef.current?.signal.aborted) {
          // Handle response for display
          let membersData = [];
          let totalMembers = 0;
          
          if (response.data) {
            membersData = response.data;
            totalMembers = response.count || response.pagination?.total_count || 0;
            setTotalCount(totalMembers);
            setTotalPages(Math.ceil(totalMembers / pageSize));
          } else if (response.results) {
            membersData = response.results;
            totalMembers = response.count || membersData.length;
            setTotalCount(totalMembers);
            setTotalPages(Math.ceil(totalMembers / pageSize));
          } else if (Array.isArray(response)) {
            membersData = response;
            totalMembers = response.length;
            setTotalCount(totalMembers);
            setTotalPages(1);
          }

          // Process the members data
          const processedMembers = membersData.map(member => ({
            ...member,
            membership_type: member.membership_type || 'unknown'
          }));

          // Apply membership type filtering if needed  
          let filtered = processedMembers;
          if (filterMembershipType !== 'all') {
            filtered = processedMembers.filter(member => 
              member.membership_type === filterMembershipType
            );
          }

          setMembers(processedMembers);
          setFilteredMembers(filtered);

          // Calculate stats from current page data and total count
          // For accurate stats across all pages, we use the total count from API
          // and estimate distribution based on current page sample
          const currentPageSample = processedMembers;
          const sampleSize = currentPageSample.length;
          
          if (sampleSize > 0 && totalMembers > 0) {
            // Calculate percentages from current sample and apply to total
            const activeRatio = currentPageSample.filter(m => m.status === 'active').length / sampleSize;
            const inactiveRatio = currentPageSample.filter(m => m.status === 'inactive').length / sampleSize;
            const indoorRatio = currentPageSample.filter(m => m.membership_type === 'indoor').length / sampleSize;
            const outdoorRatio = currentPageSample.filter(m => m.membership_type === 'outdoor').length / sampleSize;

            setStats({
              total_members: totalMembers,
              active_members: Math.round(totalMembers * activeRatio),
              inactive_members: Math.round(totalMembers * inactiveRatio),
              indoor_members: Math.round(totalMembers * indoorRatio),
              outdoor_members: Math.round(totalMembers * outdoorRatio)
            });
          } else {
            // Fallback for empty data
            setStats({
              total_members: totalMembers,
              active_members: 0,
              inactive_members: 0,
              indoor_members: 0,
              outdoor_members: 0
            });
          }
        }
      } catch (error) {
        // Only handle error if request wasn't aborted
        if (!abortControllerRef.current?.signal.aborted) {
          console.error('Error loading members data:', error);
          setError(error.message);
        }
      } finally {
        // Only update loading state if request wasn't aborted
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
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
  }, [currentPage, pageSize, searchTerm, filterStatus, filterMembershipType, refreshTrigger]);


  // Handle filter changes - reset to page 1 when filters change
  const handleFilterChange = (filters) => {
    // Reset to page 1 when filters change - this will trigger the unified useEffect
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  // Toast helper functions
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };
  
  const refreshData = () => {
    // Trigger refresh by updating the refreshTrigger
    setRefreshTrigger(prev => prev + 1);
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // The unified useEffect will handle the data fetching
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
    // The unified useEffect will handle the data fetching
  };

  // Member action handlers
  const handleViewMember = (member) => {
    setSelectedMember(member);
    setShowMemberModal(true);
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setShowUpdateModal(true);
  };

  const handleUpdateMemberStatus = async (memberId, newStatus) => {
    try {
      await memberService.updateMemberStatus(memberId, newStatus);
      showToast(`Member status updated to ${newStatus}`, 'success');
      refreshData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleRegisterMember = async (memberData) => {
    try {
      const response = await memberService.createMember(memberData);
      showToast(response.message || 'Member registered successfully!', 'success');
      setShowRegisterModal(false);
      refreshData();
    } catch (error) {
      // Re-throw the error so the form can handle it
      // This preserves the error details for form field errors
      throw error;
    }
  };

  const handleUpdateMemberProfile = async (updatedData) => {
    try {
      const response = await memberService.updateMemberProfile(selectedMember.id, updatedData);
      showToast(response.message || 'Profile updated successfully', 'success');
      setShowUpdateModal(false);
      refreshData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleRequestPayment = (member) => {
    setSelectedMember(member);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (paymentFormData) => {
    try {
      const response = await memberService.processPayment(selectedMember.id, paymentFormData);
      setPaymentData(response.payment);
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      showToast(response.message || 'Payment processed successfully', 'success');
      refreshData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleSendReminder = (member) => {
    setSelectedMember(member);
    setShowReminderModal(true);
  };

  const handleReminderSent = async (reminderData) => {
    try {
      await memberService.sendPaymentReminder(selectedMember.id, reminderData);
      showToast('Payment reminder sent successfully', 'success');
      setShowReminderModal(false);
    } catch (error) {
      showToast(error.message, 'error');
      setShowReminderModal(false);
    }
  };

  const handleDeleteMember = async (member) => {
    if (!window.confirm(`Are you sure you want to delete ${getMemberDisplayName(member)}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await memberService.deleteMember(member.id);
      showToast(response.message || 'Member deleted successfully', 'success');
      setShowMemberModal(false);
      refreshData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleExportMembers = async () => {
    try {
      const blob = await memberService.exportMembers('csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `members_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('Members data exported successfully', 'success');
    } catch (error) {
      showToast(error.message || 'Export failed.', 'error');
    }
  };

  // Badge helper functions
  const getStatusBadge = (status) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      suspended: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
      </span>
    );
  };

  const getMembershipTypeBadge = (type) => {
    const typeStyles = {
      indoor: 'bg-blue-100 text-blue-800',
      outdoor: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeStyles[type] || 'bg-gray-100 text-gray-800'}`}>
        {type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Unknown'}
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
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {[...Array(5)].map((_, i) => (
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
                <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Members</h3>
                <p className="text-red-600">{error}</p>
                <Button 
                  variant="primary" 
                  onClick={refreshData}
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
                <h1 className="text-2xl font-bold text-gray-900">All Members</h1>
                <p className="text-gray-600 mt-1">Manage all gym members and their information</p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={handleExportMembers}>
                  Export Members
                </Button>
                <Button 
                  variant="primary"
                  onClick={() => setShowRegisterModal(true)}
                >
                  Add New Member
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card
                title="Total Members"
                value={stats.total_members}
                subtitle="All registered"
              />
              <Card
                title="Active Members"
                value={stats.active_members}
                subtitle="Currently active"
                className="border-green-200"
              />
              <Card
                title="Inactive Members"
                value={stats.inactive_members}
                subtitle="Need attention"
                className="border-red-200"
              />
              <Card
                title="Indoor Members"
                value={stats.indoor_members}
                subtitle="Indoor access"
                className="border-blue-200"
              />
              <Card
                title="Outdoor Members"
                value={stats.outdoor_members}
                subtitle="Outdoor access"
                className="border-green-200"
              />
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        handleFilterChange({ q: e.target.value || undefined });
                      }}
                      className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex space-x-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setFilterStatus('all');
                        handleFilterChange({ status: undefined });
                      }}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        filterStatus === 'all'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => {
                        setFilterStatus('active');
                        handleFilterChange({ status: 'active' });
                      }}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        filterStatus === 'active'
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => {
                        setFilterStatus('inactive');
                        handleFilterChange({ status: 'inactive' });
                      }}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        filterStatus === 'inactive'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Inactive
                    </button>
                  </div>
                  <select
                    value={filterMembershipType}
                    onChange={(e) => {
                      setFilterMembershipType(e.target.value);
                      handleFilterChange({ membership_type: e.target.value === 'all' ? undefined : e.target.value });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {members.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No members found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || filterStatus !== 'all' || filterMembershipType !== 'all' 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Get started by adding your first member.'
                    }
                  </p>
                  {(!searchTerm && filterStatus === 'all' && filterMembershipType === 'all') && (
                    <Button 
                      variant="primary" 
                      onClick={() => setShowRegisterModal(true)}
                      className="mt-4"
                    >
                      Add First Member
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membership Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan & Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {members.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-700">
                                    {getMemberInitials(member)}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{getMemberDisplayName(member)}</div>
                                <div className="text-sm text-gray-500">{member.email}</div>
                                <div className="text-xs text-gray-400">{member.member_id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{getMembershipTypeBadge(member.membership_type)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(member.status)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{getPaymentStatusBadge(member.payment_status)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{member.plan_type}</div>
                            <div className="text-sm text-gray-500">{formatCurrency(member.amount)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{member.last_visit ? formatDate(member.last_visit) : 'Never'}</div>
                            <div className="text-xs text-gray-500">{member.total_visits} total visits</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button onClick={() => handleViewMember(member)} className="text-blue-600 hover:text-blue-900">View</button>
                            <button onClick={() => handleEditMember(member)} className="text-green-600 hover:text-green-900">Edit</button>
                            <button onClick={() => handleRequestPayment(member)} className="text-purple-600 hover:text-purple-900">Payment</button>
                            {member.payment_status === 'overdue' && (
                              <button onClick={() => handleSendReminder(member)} className="text-orange-600 hover:text-orange-900">Remind</button>
                            )}
                            {member.status === 'active' ? (
                              <button onClick={() => handleUpdateMemberStatus(member.id, 'inactive')} className="text-red-600 hover:text-red-900">Suspend</button>
                            ) : (
                              <button onClick={() => handleUpdateMemberStatus(member.id, 'active')} className="text-green-600 hover:text-green-900">Activate</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center text-sm text-gray-700">
                    <span>
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} members
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                      <span>←</span>
                      <span className="hidden sm:inline">Previous</span>
                    </button>
                    
                    <div className="flex space-x-1">
                      {/* Show first page if current page is far from start */}
                      {currentPage > 3 && totalPages > 5 && (
                        <>
                          <button
                            onClick={() => handlePageChange(1)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            1
                          </button>
                          {currentPage > 4 && <span className="px-2 py-2 text-sm text-gray-500">...</span>}
                        </>
                      )}
                      
                      {/* Show page numbers around current page */}
                      {(() => {
                        const start = Math.max(1, currentPage - 2);
                        const end = Math.min(totalPages, currentPage + 2);
                        const pages = [];
                        
                        for (let i = start; i <= end; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => handlePageChange(i)}
                              className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                                currentPage === i
                                  ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                                  : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }
                        
                        return pages;
                      })()}
                      
                      {/* Show last page if current page is far from end */}
                      {currentPage < totalPages - 2 && totalPages > 5 && (
                        <>
                          {currentPage < totalPages - 3 && <span className="px-2 py-2 text-sm text-gray-500">...</span>}
                          <button
                            onClick={() => handlePageChange(totalPages)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* --- MODALS & TOAST --- */}
      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={hideToast} />

      <Modal isOpen={showMemberModal} onClose={() => setShowMemberModal(false)} title="Member Details" size="large">
        {selectedMember && (
          <div className="space-y-6">
            <div className="flex items-center justify-between"><div className="flex items-center space-x-4"><div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center"><span className="text-xl font-medium text-gray-700">{getMemberInitials(selectedMember)}</span></div><div><h3 className="text-xl font-bold text-gray-900">{getMemberDisplayName(selectedMember)}</h3><p className="text-gray-600">Member ID: {selectedMember.member_id || selectedMember.id}</p></div></div><div className="flex space-x-2"><Button variant="primary" onClick={() => handleEditMember(selectedMember)}>Edit</Button><Button variant="outline" onClick={() => handleDeleteMember(selectedMember)} className="border-red-300 text-red-700 hover:bg-red-50">Delete</Button></div></div>
            <div><h4 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-4"><div><label className="text-sm font-medium text-gray-500">Name</label><p className="text-sm text-gray-900">{getMemberDisplayName(selectedMember)}</p></div><div><label className="text-sm font-medium text-gray-500">Phone</label><p className="text-sm text-gray-900">{selectedMember.phone || 'Not provided'}</p></div><div><label className="text-sm font-medium text-gray-500">Date of Birth</label><p className="text-sm text-gray-900">{selectedMember.dateOfBirth ? formatDate(selectedMember.dateOfBirth) : 'Not provided'}</p></div><div><label className="text-sm font-medium text-gray-500">Join Date</label><p className="text-sm text-gray-900">{selectedMember.join_date ? formatDate(selectedMember.join_date) : 'Not provided'}</p></div></div><div className="space-y-4"><div><label className="text-sm font-medium text-gray-500">Email</label><p className="text-sm text-gray-900">{selectedMember.email || 'Not provided'}</p></div><div><label className="text-sm font-medium text-gray-500">Address</label><p className="text-sm text-gray-900">{selectedMember.address || 'Not provided'}</p></div><div><label className="text-sm font-medium text-gray-500">Membership Type</label><div className="mt-1">{getMembershipTypeBadge(selectedMember.membership_type)}</div></div><div><label className="text-sm font-medium text-gray-500">Status</label><div className="mt-1">{getStatusBadge(selectedMember.status)}</div></div></div></div></div>
            <div><h4 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="text-sm font-medium text-gray-500">Contact Name</label><p className="text-sm text-gray-900">{selectedMember.emergency_contact_name || 'Not provided'}</p></div><div><label className="text-sm font-medium text-gray-500">Contact Phone</label><p className="text-sm text-gray-900">{selectedMember.emergency_contact_phone || 'Not provided'}</p></div></div></div>
            <div><h4 className="text-lg font-medium text-gray-900 mb-4">Fitness Information</h4><div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4"><div className="bg-gray-50 rounded-lg p-4"><div className="text-2xl font-bold text-gray-900">{selectedMember.height ? `${selectedMember.height} cm` : 'N/A'}</div><div className="text-sm text-gray-600">Height</div></div><div className="bg-gray-50 rounded-lg p-4"><div className="text-2xl font-bold text-gray-900">{selectedMember.weight ? `${selectedMember.weight} kg` : 'N/A'}</div><div className="text-sm text-gray-600">Weight</div></div><div className="bg-gray-50 rounded-lg p-4"><div className="text-2xl font-bold text-gray-900">{selectedMember.bmi || 'N/A'}</div><div className="text-sm text-gray-600">BMI</div>{selectedMember.bmi && (<div className="mt-1"><span className={`px-2 py-1 text-xs font-medium rounded-full ${getBMICategory(selectedMember.bmi).style}`}>{getBMICategory(selectedMember.bmi).label}</span></div>)}</div><div className="bg-gray-50 rounded-lg p-4"><div className="text-2xl font-bold text-gray-900 capitalize">{selectedMember.fitnessLevel || 'N/A'}</div><div className="text-sm text-gray-600">Fitness Level</div></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-sm font-medium text-gray-500">Short-term Goals</label><div className="mt-1 p-3 bg-blue-50 rounded-lg"><p className="text-sm text-blue-900">{selectedMember.short_term_goals || 'No goals set'}</p></div></div><div><label className="text-sm font-medium text-gray-500">Long-term Goals</label><div className="mt-1 p-3 bg-green-50 rounded-lg"><p className="text-sm text-green-900">{selectedMember.long_term_goals || 'No goals set'}</p></div></div></div></div>
            <div><h4 className="text-lg font-medium text-gray-900 mb-4">Activity Summary</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="bg-gray-50 rounded-lg p-4"><div className="text-2xl font-bold text-gray-900">{selectedMember.total_visits || 0}</div><div className="text-sm text-gray-600">Total Visits</div></div><div className="bg-gray-50 rounded-lg p-4"><div className="text-2xl font-bold text-gray-900">{selectedMember.last_visit ? formatDate(selectedMember.last_visit) : 'Never'}</div><div className="text-sm text-gray-600">Last Visit</div></div><div className="bg-gray-50 rounded-lg p-4"><div className="text-2xl font-bold text-gray-900">{selectedMember.expiry_date ? Math.max(0, Math.ceil((new Date(selectedMember.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))) : 'N/A'}</div><div className="text-sm text-gray-600">Days Remaining</div></div></div></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} size="large" title="Register New Member">
        <RegisterMemberForm onSubmit={handleRegisterMember} onCancel={() => setShowRegisterModal(false)} />
      </Modal>

      <Modal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} title="Update Member Profile" size="full">
        <UpdateMemberProfileForm initialData={selectedMember} onSubmit={handleUpdateMemberProfile} onCancel={() => setShowUpdateModal(false)} />
      </Modal>

      <PaymentForm member={selectedMember} isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} onPaymentSuccess={handlePaymentSuccess} />
      
      <Modal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} title="Payment Receipt" size="medium">
        <Receipt paymentData={paymentData} member={selectedMember} onClose={() => setShowReceiptModal(false)} onPrint={() => showToast('Receipt printed successfully', 'success')} />
      </Modal>

      <PaymentReminder member={selectedMember} isOpen={showReminderModal} onClose={() => setShowReminderModal(false)} onReminderSent={handleReminderSent} />
    </div>
  );
};

export default Members;