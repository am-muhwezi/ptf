import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import RegisterMemberForm from '../../components/forms/RegisterMemberForm';
import outdoorMembershipService from '../../services/outdoorMembershipService';

const OutdoorMemberships = () => {
  const abortControllerRef = useRef(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [allMembers, setAllMembers] = useState([]);
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
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
  const [rateCards, setRateCards] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Load sample outdoor memberships for stats
  const loadAllOutdoorMembers = async () => {
    try {
      const response = await outdoorMembershipService.getMembers({
        page: 1,
        limit: 50
      });
      
      if (response.success && response.data) {
        const transformedMembers = response.data.map(transformMemberData);
        setAllMembers(transformedMembers);
      }
    } catch (err) {
      console.error('Failed to load outdoor members for stats:', err);
    }
  };

  // Load outdoor memberships from API (for display)
  const loadOutdoorMembers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await outdoorMembershipService.getAll({
        search: searchTerm,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        page: page,
        limit: 20
      });
      
      if (response.success) {
        const transformedMembers = response.members.data.map(transformMemberData);
        setMembers(transformedMembers);
        setFilteredMembers(transformedMembers);
        
        // Handle pagination
        setCurrentPage(page);
        setHasNext(!!response.members.next);
        setHasPrevious(!!response.members.previous);
        
        // Calculate total pages from count
        if (response.members.count) {
          setTotalPages(Math.ceil(response.members.count / 20));
        }
      } else {
        throw new Error('Failed to load outdoor memberships');
      }
    } catch (err) {
      setError(err.message);
      showToast('Error loading outdoor memberships: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load membership statistics
  const loadStats = async () => {
    try {
      const response = await outdoorMembershipService.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  // Load outdoor membership data with proper cleanup (unified pattern)
  useEffect(() => {
    console.log('🟠 OutdoorMemberships useEffect mounted');
    
    const loadData = async () => {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      
      setLoading(true);
      setError(null);
      
      try {
        const params = {
          page: currentPage,
          limit: 50,
          ...(searchTerm && { search: searchTerm }),
          ...(filterStatus !== 'all' && { status: filterStatus })
        };
        
        const response = await outdoorMembershipService.getAll(params);
        
        // Check if request was aborted
        if (signal.aborted) return;
        
        if (response.success) {
          const transformedMembers = response.members.data.map(transformMemberData);
          setAllMembers(transformedMembers);
          setMembers(transformedMembers.slice(0, 20)); // Display first 20
          setFilteredMembers(transformedMembers); // For local filtering
          setStats(response.stats);
          
          // Handle pagination
          setHasNext(!!response.members.next);
          setHasPrevious(!!response.members.previous);
          if (response.members.count) {
            setTotalPages(Math.ceil(response.members.count / 20));
          }
        }
      } catch (err) {
        if (!signal.aborted) {
          setError(err.message);
          showToast('Error loading outdoor memberships: ' + err.message, 'error');
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };
    
    // Debounce search/filter changes
    const timeoutId = setTimeout(loadData, searchTerm || filterStatus !== 'all' ? 300 : 0);
    
    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentPage, searchTerm, filterStatus, refreshTrigger]); // Proper dependency array

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage); // useEffect will handle the API call
    }
  };


  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  // Handle session usage (check-in)
  const handleUseSession = async (membershipId, location = '') => {
    try {
      const response = await membershipService.useSession(membershipId, { location });
      if (response.success) {
        showToast(response.message, 'success');
        // Trigger refresh via useEffect
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      showToast('Failed to use session: ' + err.message, 'error');
    }
  };

  // Handle member deletion
  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await membershipService.deleteOutdoorMember(memberId);
      if (response.success) {
        showToast(response.message, 'success');
        // Refresh the member list
        setRefreshTrigger(prev => prev + 1);
        loadStats();
      }
    } catch (err) {
      showToast('Failed to delete member: ' + err.message, 'error');
    }
  };

  const handleViewMember = (member) => {
    setSelectedMember(member);
    setShowMemberModal(true);
  };

  const handleRenewMembership = (memberId) => {
    // TODO: Implement renewal functionality when backend endpoint is ready
    showToast(`Membership renewal initiated for member ${memberId}`, 'success');
  };

  const handleSuspendMember = async (memberId) => {
    try {
      // Update member status to suspended
      const member = members.find(m => m.id === memberId);
      if (member) {
        const updatedData = { ...member, status: 'suspended' };
        const response = await membershipService.updateOutdoorMember(memberId, updatedData);
        if (response.success) {
          showToast(`Member has been suspended`, 'warning');
          setRefreshTrigger(prev => prev + 1);
          loadStats();
        }
      }
    } catch (err) {
      showToast('Failed to suspend member: ' + err.message, 'error');
    }
  };

  const handleAddOutdoorMember = async (memberData) => {
    try {
      const response = await membershipService.createOutdoorMember(memberData);
      if (response.success) {
        showToast('Outdoor member added successfully!', 'success');
        setShowAddMemberModal(false);
        setRefreshTrigger(prev => prev + 1);
        loadAllOutdoorMembers();
        loadStats();
      }
    } catch (err) {
      showToast('Failed to add member: ' + err.message, 'error');
      throw err;
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      suspended: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
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
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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

  // Get plan display name based on pricing structure
  const getPlanDisplayName = (planName, sessionsPerWeek, weeklyFee) => {
    const fee = parseFloat(weeklyFee);
    const sessions = parseInt(sessionsPerWeek);
    
    // Map based on the pricing structure
    if (fee === 1000) return `Daily Drop-in - KES 1,000`;
    if (fee === 3000 && sessions === 1) return `1 Session/Week (4 classes/month) - KES 3,000`;
    if (fee === 4000 && sessions === 2) return `2 Sessions/Week (8 classes/month) - KES 4,000`;
    if (fee === 5000 && sessions === 3) return `3 Sessions/Week (12 classes/month) - KES 5,000`;
    if (fee === 6000 && sessions === 4) return `4 Sessions/Week (16 classes/month) - KES 6,000`;
    if (fee === 7000 && sessions === 5) return `5 Sessions/Week (20 classes/month) - KES 7,000`;
    
    // Fallback to original plan name if no match
    return planName || `${sessions} Sessions/Week - KES ${fee}`;
  };

  // Transform API data to match component expectations
  const transformMemberData = (apiMembership) => {
    const planDisplayName = getPlanDisplayName(
      apiMembership.plan_name, 
      apiMembership.sessions_per_week, 
      apiMembership.weekly_fee
    );
    
    return {
      id: apiMembership.member_id_display || `PTF${String(apiMembership.member).padStart(6, '0')}`,
      membershipId: apiMembership.id,
      firstName: apiMembership.member_name?.split(' ')[0] || 'N/A',
      lastName: apiMembership.member_name?.split(' ').slice(1).join(' ') || '',
      email: apiMembership.member_email,
      phone: apiMembership.member_phone,
      membershipType: 'outdoor',
      status: apiMembership.status,
      joinDate: apiMembership.start_date,
      expiryDate: apiMembership.end_date,
      lastVisit: null, // Not directly available in membership model
      totalVisits: 0, // Will be calculated from session logs
      planType: planDisplayName,
      amount: apiMembership.weekly_fee,
      paymentStatus: apiMembership.payment_status,
      location: apiMembership.location_name,
      sessionsPerWeek: apiMembership.sessions_per_week,
      totalSessionsAllowed: apiMembership.total_sessions_allowed,
      sessionsUsed: apiMembership.sessions_used,
      sessionsRemaining: apiMembership.sessions_remaining,
      isExpiringSoon: apiMembership.is_expiring_soon,
      usagePercentage: apiMembership.usage_percentage
    };
  };

  const isExpiringSoon = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

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
                <h1 className="text-2xl font-bold text-gray-900">Outdoor Memberships</h1>
                <p className="text-gray-600 mt-1">Manage outdoor fitness memberships and activities</p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline">Export Data</Button>
                <Button 
                  variant="primary"
                  onClick={() => setShowAddMemberModal(true)}
                >
                  Add New Member
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card
                title="Total Outdoor Members"
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
                subtitle="From outdoor memberships"
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
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan & Sessions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {members.length === 0 && !loading && (
                      <tr>
                        <td colSpan="7" className="px-6 py-12">
                          <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <h3 className="mt-4 text-lg font-medium text-gray-900">No outdoor members found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              {searchTerm || filterStatus !== 'all' 
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Get started by adding your first outdoor member.'
                              }
                            </p>
                            {(!searchTerm && filterStatus === 'all') && (
                              <button 
                                onClick={() => setShowAddMemberModal(true)}
                                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Add Outdoor Member
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {member.firstName?.charAt(0)?.toUpperCase()}{member.lastName?.charAt(0)?.toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {member.firstName} {member.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">
                            {member.location || 'Not specified'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{member.planType}</div>
                          <div className="text-sm text-gray-500">{formatCurrency(member.amount)}</div>
                          {member.sessionsRemaining !== undefined && (
                            <div className="text-xs text-blue-600 font-medium">
                              {member.sessionsRemaining} sessions left
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(member.status)}
                          {member.isExpiringSoon && (
                            <div className="text-xs text-orange-600 font-medium mt-1">Expiring Soon</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPaymentStatusBadge(member.paymentStatus)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleViewMember(member)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          {member.status === 'active' && member.sessionsRemaining > 0 && (
                            <button
                              onClick={() => handleUseSession(member.membershipId, member.location)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Check In
                            </button>
                          )}
                          <button
                            onClick={() => handleRenewMembership(member.id)}
                            className="text-purple-600 hover:text-purple-900"
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
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center text-sm text-gray-700">
                    <span>
                      Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, members.length + ((currentPage - 1) * 20))} of {allMembers.length} outdoor members
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

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        title="Add New Outdoor Member"
        size="large"
      >
        <RegisterMemberForm
          initialMembershipType="outdoor"
          onSubmit={handleAddOutdoorMember}
          onCancel={() => setShowAddMemberModal(false)}
        />
      </Modal>

      {/* Member Details Modal */}
      <Modal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        title="Outdoor Member Details"
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
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-sm text-gray-900 capitalize">{selectedMember.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Plan Type</label>
                    <p className="text-sm text-gray-900">{selectedMember.planType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sessions Per Week</label>
                    <p className="text-sm text-gray-900">{selectedMember.sessionsPerWeek || 'N/A'}</p>
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
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Session Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">{selectedMember.totalSessionsAllowed || 0}</div>
                  <div className="text-sm text-gray-600">Total Sessions</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">{selectedMember.sessionsUsed || 0}</div>
                  <div className="text-sm text-gray-600">Sessions Used</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{selectedMember.sessionsRemaining || 0}</div>
                  <div className="text-sm text-gray-600">Sessions Left</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.ceil((new Date(selectedMember.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))}
                  </div>
                  <div className="text-sm text-gray-600">Days Remaining</div>
                </div>
              </div>
              
              {selectedMember.usagePercentage !== undefined && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Usage Progress</span>
                    <span>{Math.round(selectedMember.usagePercentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{width: `${selectedMember.usagePercentage}%`}}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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

export default OutdoorMemberships;