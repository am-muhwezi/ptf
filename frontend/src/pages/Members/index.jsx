// frontend/src/pages/Members/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMembershipType, setFilterMembershipType] = useState('all');

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

  // Fetch members data
  const fetchMembers = useCallback(async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = { 
        page: page,
        limit: pageSize
      };
      if (searchTerm) params.search = searchTerm;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterMembershipType !== 'all') params.membership_type = filterMembershipType;

      const response = await memberService.getMembers(params);
      
      // Handle Django REST framework pagination response
      if (response.results) {
        setMembers(response.results);
        setTotalCount(response.count);
        setTotalPages(Math.ceil(response.count / pageSize));
      } else {
        // Fallback for non-paginated response
        setMembers(response);
        setTotalCount(response.length);
        setTotalPages(1);
      }

    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, filterStatus, filterMembershipType]);


  // Initial data fetch
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchMembers(1);
    }
  }, [searchTerm, filterStatus, filterMembershipType]);

  // Fetch stats separately since we're using pagination
  const fetchStats = useCallback(async () => {
    try {
      // For now, calculate stats from total count and current filters
      // In a real app, you'd have a separate stats endpoint
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterMembershipType !== 'all') params.membership_type = filterMembershipType;
      
      setStats(prevStats => ({
        ...prevStats,
        total_members: totalCount
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [totalCount, filterStatus, filterMembershipType]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Update filtered members when members change
  useEffect(() => {
    setFilteredMembers(members);
  }, [members]);

  // Toast helper functions
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };
  
  const refreshData = async () => {
      await Promise.all([
          fetchMembers(),
          fetchStats()
      ]);
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchMembers(newPage);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchMembers(1);
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
      await refreshData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleRegisterMember = async (memberData) => {
    try {
      const response = await memberService.createMember(memberData);
      showToast(response.message || 'Member registered successfully!', 'success');
      setShowRegisterModal(false);
      await refreshData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleUpdateMemberProfile = async (updatedData) => {
    try {
      const response = await memberService.updateMemberProfile(selectedMember.id, updatedData);
      showToast(response.message || 'Profile updated successfully', 'success');
      setShowUpdateModal(false);
      await refreshData();
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
      await refreshData();
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
      outdoor: 'bg-green-100 text-green-800',
      both: 'bg-purple-100 text-purple-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeStyles[type] || 'bg-gray-100 text-gray-800'}`}>
        {type === 'both' ? 'Indoor + Outdoor' : type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Unknown'}
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
                  onClick={fetchMembers}
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
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex space-x-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setFilterStatus('all')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        filterStatus === 'all'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilterStatus('active')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        filterStatus === 'active'
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => setFilterStatus('inactive')}
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
                    onChange={(e) => setFilterMembershipType(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {filteredMembers.length === 0 ? (
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
                      {filteredMembers.map((member) => (
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
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-700">
                    <span>
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} members
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <div className="flex space-x-1">
                      {[...Array(Math.min(5, totalPages))].map((_, index) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = index + 1;
                        } else if (currentPage <= 3) {
                          pageNum = index + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + index;
                        } else {
                          pageNum = currentPage - 2 + index;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1 text-sm border rounded-md ${
                              currentPage === pageNum
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
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
            <div className="flex items-center justify-between"><div className="flex items-center space-x-4"><div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center"><span className="text-xl font-medium text-gray-700">{getMemberInitials(selectedMember)}</span></div><div><h3 className="text-xl font-bold text-gray-900">{getMemberDisplayName(selectedMember)}</h3><p className="text-gray-600">Member ID: {selectedMember.member_id || selectedMember.id}</p></div></div><Button variant="primary" onClick={() => handleEditMember(selectedMember)}>Edit</Button></div>
            <div><h4 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-4"><div><label className="text-sm font-medium text-gray-500">Name</label><p className="text-sm text-gray-900">{getMemberDisplayName(selectedMember)}</p></div><div><label className="text-sm font-medium text-gray-500">Phone</label><p className="text-sm text-gray-900">{selectedMember.phone || 'Not provided'}</p></div><div><label className="text-sm font-medium text-gray-500">Date of Birth</label><p className="text-sm text-gray-900">{selectedMember.dateOfBirth ? formatDate(selectedMember.dateOfBirth) : 'Not provided'}</p></div><div><label className="text-sm font-medium text-gray-500">Join Date</label><p className="text-sm text-gray-900">{selectedMember.join_date ? formatDate(selectedMember.join_date) : 'Not provided'}</p></div></div><div className="space-y-4"><div><label className="text-sm font-medium text-gray-500">Email</label><p className="text-sm text-gray-900">{selectedMember.email || 'Not provided'}</p></div><div><label className="text-sm font-medium text-gray-500">Address</label><p className="text-sm text-gray-900">{selectedMember.address || 'Not provided'}</p></div><div><label className="text-sm font-medium text-gray-500">Membership Type</label><div className="mt-1">{getMembershipTypeBadge(selectedMember.membership_type)}</div></div><div><label className="text-sm font-medium text-gray-500">Status</label><div className="mt-1">{getStatusBadge(selectedMember.status)}</div></div></div></div></div>
            <div><h4 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="text-sm font-medium text-gray-500">Contact Name</label><p className="text-sm text-gray-900">{selectedMember.emergencyContact || 'Not provided'}</p></div><div><label className="text-sm font-medium text-gray-500">Contact Phone</label><p className="text-sm text-gray-900">{selectedMember.emergencyPhone || 'Not provided'}</p></div></div></div>
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