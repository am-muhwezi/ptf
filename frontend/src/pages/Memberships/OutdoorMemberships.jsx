import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import RegisterMemberForm from '../../components/forms/RegisterMemberForm';
import PaymentForm from '../../components/forms/PaymentForm';
import Receipt from '../../components/ui/Receipt';
import outdoorMembershipService from '../../services/outdoorMembershipService';
import { membershipService } from '../../services/membershipService';
import { paymentService } from '../../services/paymentService';

const OutdoorMemberships = () => {
  const abortControllerRef = useRef(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberPaymentHistory, setMemberPaymentHistory] = useState([]);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [renewalMember, setRenewalMember] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
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
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [allMembersLoaded, setAllMembersLoaded] = useState(false);


  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load outdoor membership statistics separately
  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const response = await outdoorMembershipService.getStats();

      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to load outdoor membership stats:', err);
      setError('Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  // Load outdoor memberships from API with caching and lazy loading
  const loadOutdoorMembers = async (page = 1, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const requestParams = {
        search: searchTerm,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        location: filterLocation !== 'all' ? filterLocation : undefined,
        page: page,
        limit: 20
      };

      console.log('🟠 Loading outdoor members with params:', requestParams);

      const response = await outdoorMembershipService.getMembers(requestParams);

      if (response.success) {
        const transformedMembers = response.members.data.map(transformMemberData);
        const totalCount = response.members.count || 0;
        const totalPages = Math.ceil(totalCount / 20);

        console.log('🟠 API Response:', {
          membersCount: transformedMembers.length,
          totalCount,
          isLoadMore,
          currentMembersLength: members.length
        });

        // Calculate if there are more pages based on current loaded members vs total
        let newMembersLength;
        if (isLoadMore) {
          // When loading more, check if combined length is less than total
          newMembersLength = members.length + transformedMembers.length;
          setMembers(prevMembers => {
            console.log('🟠 Adding to existing members:', { existing: prevMembers.length, new: transformedMembers.length });
            return [...prevMembers, ...transformedMembers];
          });
        } else {
          // When replacing, check if current page's data length is less than total
          newMembersLength = transformedMembers.length;
          console.log('🟠 Replacing members with:', transformedMembers.length, 'members');
          setMembers(transformedMembers);
        }

        const hasNext = newMembersLength < totalCount;
        const hasPrevious = page > 1;

        // Handle pagination
        setCurrentPage(page);
        setHasNext(hasNext);
        setHasPrevious(hasPrevious);
        setTotalCount(totalCount);
        setTotalPages(totalPages);
        setAllMembersLoaded(!hasNext);
      } else {
        throw new Error('Failed to load outdoor memberships');
      }
    } catch (err) {
      setError(err.message);
      showToast('Error loading outdoor memberships: ' + err.message, 'error');
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Clear cache when filters change or data is modified
  const clearCache = () => {
    outdoorMembershipService.clearCache();
  };

  // Load stats separately - only when component mounts or refreshTrigger changes
  useEffect(() => {
    console.log('🟠 Loading outdoor membership stats');
    loadStats();
  }, [refreshTrigger]);

  // Load member data with proper cleanup and debouncing
  useEffect(() => {
    console.log('🟠 OutdoorMemberships useEffect mounted', { searchTerm, filterStatus, filterLocation });

    const loadData = async () => {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        // Reset pagination state when filters change
        setCurrentPage(1);
        setAllMembersLoaded(false);

        // Clear cache when search/filter changes
        console.log('🗑️ Clearing cache before loading filtered data');
        clearCache();

        // Force clear the members state before loading new data
        setMembers([]);
        setError(null);

        await loadOutdoorMembers(1, false);
      } catch (err) {
        if (!abortControllerRef.current?.signal?.aborted) {
          setError(err.message);
          showToast('Error loading outdoor memberships: ' + err.message, 'error');
        }
      }
    };

    // Debounce search/filter changes
    const timeoutId = setTimeout(loadData, searchTerm || filterStatus !== 'all' || filterLocation !== 'all' ? 300 : 0);

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchTerm, filterStatus, filterLocation]); // Removed currentPage from dependencies

  // Handle load more functionality for lazy loading
  const handleLoadMore = () => {
    if (!loadingMore && hasNext && !allMembersLoaded) {
      const nextPage = currentPage + 1;
      console.log(`🟠 Loading more members - page ${nextPage}`);
      loadOutdoorMembers(nextPage, true); // true = append to existing members
    }
  };

  // Handle infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

      // Trigger load more when user scrolls to 80% of the page
      if (scrollTop + clientHeight >= scrollHeight * 0.8 &&
          !loadingMore && hasNext && !allMembersLoaded) {
        handleLoadMore();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasNext, allMembersLoaded, currentPage]);


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
        // Clear cache and trigger refresh
        clearCache();
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
        // Clear cache and refresh the member list
        clearCache();
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      showToast('Failed to delete member: ' + err.message, 'error');
    }
  };

  const handleViewMember = async (member) => {
    setSelectedMember(member);
    setShowMemberModal(true);

    // Load payment history for the member
    setLoadingPaymentHistory(true);
    try {
      const response = await paymentService.getPaymentHistory(member.membershipId);
      if (response.success) {
        setMemberPaymentHistory(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load payment history:', error);
      setMemberPaymentHistory([]);
    } finally {
      setLoadingPaymentHistory(false);
    }
  };

  const handleRenewMembership = (memberId) => {
    const member = members.find(m => m.id === memberId || m.membershipId === memberId);
    if (member) {
      // Transform member data for payment form
      const renewalData = {
        id: member.membershipId,
        member_id: member.id,
        first_name: member.firstName,
        last_name: member.lastName,
        email: member.email,
        phone: member.phone,
        plan_type: member.planType,
        membership_type: 'outdoor',
        amount: member.amount
      };
      setRenewalMember(renewalData);
      setShowRenewalModal(true);
    }
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
          clearCache();
          setRefreshTrigger(prev => prev + 1);
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
        clearCache();
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      showToast('Failed to add member: ' + err.message, 'error');
      throw err;
    }
  };

  const handleRenewalSuccess = async (paymentData) => {
    try {
      // Renewal payment was recorded successfully
      showToast('Membership renewal payment recorded successfully!', 'success');
      setShowRenewalModal(false);

      // Clear cache and refresh data
      clearCache();
      setRefreshTrigger(prev => prev + 1);

      // Show receipt if payment data available
      if (paymentData) {
        setSelectedReceipt({ paymentData, member: renewalMember });
        setShowReceiptModal(true);
      }
    } catch (err) {
      showToast('Renewal successful but failed to show receipt', 'warning');
    }
  };

  const handleViewReceipt = async (payment) => {
    try {
      // Generate receipt data from payment history
      const receiptData = {
        amount: payment.amount,
        timestamp: payment.payment_date || payment.created_at,
        payment_method: payment.payment_method,
        transaction_reference: payment.transaction_reference,
        mpesaReceiptNumber: payment.mpesa_receipt_number,
        receiptNumber: payment.receipt_number,
        payment_method_display: payment.payment_method_display
      };

      setSelectedReceipt({ paymentData: receiptData, member: selectedMember });
      setShowReceiptModal(true);
    } catch (err) {
      showToast('Failed to load receipt', 'error');
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
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
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
                value={statsLoading ? '...' : stats.total_memberships || 0}
                subtitle="Active memberships"
              />
              <Card
                title="Active Members"
                value={statsLoading ? '...' : stats.active_memberships || 0}
                subtitle="Currently active"
              />
              <Card
                title="Expiring Soon"
                value={statsLoading ? '...' : stats.expiring_soon || 0}
                subtitle="Within 30 days"
              />
              <Card
                title="Monthly Revenue"
                value={statsLoading ? '...' : formatCurrency(0)}
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
                  <select
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Locations</option>
                    <option value="arboretum">Arboretum</option>
                    <option value="boxwood">Boxwood</option>
                    <option value="karura">Karura</option>
                    <option value="sagret">Sagret</option>
                    <option value="mushroom">Mushroom</option>
                    <option value="pcea_loreto">PCEA Loreto</option>
                    <option value="bethany">Bethany</option>
                    <option value="5star">5Star</option>
                    <option value="kijani">Kijani</option>
                    <option value="rustique">Rustique</option>
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
                              {searchTerm || filterStatus !== 'all' || filterLocation !== 'all'
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Get started by adding your first outdoor member.'
                              }
                            </p>
                            {(!searchTerm && filterStatus === 'all' && filterLocation === 'all') && (
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
                          {member.status === 'active' && member.sessionsRemaining > 0 && member.paymentStatus === 'paid' && (
                            <button
                              onClick={() => handleUseSession(member.membershipId, member.location)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Check In
                            </button>
                          )}
                          {member.status === 'active' && member.paymentStatus === 'pending' && (
                            <span className="text-orange-600 text-xs">
                              Payment Pending
                            </span>
                          )}
                          {member.status === 'active' && member.paymentStatus === 'overdue' && (
                            <span className="text-red-600 text-xs">
                              Payment Overdue
                            </span>
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
              
              {/* Load More and Pagination Controls */}
              {members.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-center text-sm text-gray-600 mb-3">
                    <span>
                      Showing {members.length} {totalCount > 0 && `of ${totalCount}`} outdoor members
                    </span>
                  </div>

                  {loadingMore && (
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                      <span className="text-sm text-gray-600">Loading more members...</span>
                    </div>
                  )}

                  {!loadingMore && hasNext && !allMembersLoaded && (
                    <div className="text-center">
                      <button
                        onClick={handleLoadMore}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        disabled={loadingMore}
                      >
                        Load More Members
                      </button>
                    </div>
                  )}

                  {(allMembersLoaded || (!hasNext && members.length > 0)) && (
                    <div className="text-center text-sm text-gray-500 italic">
                      All outdoor members loaded
                    </div>
                  )}
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
          <div className="space-y-6 max-h-[80vh] overflow-y-auto">
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

            {/* Payment History Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment History</h3>
              {loadingPaymentHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading payment history...</span>
                </div>
              ) : memberPaymentHistory.length > 0 ? (
                <div className="space-y-4">
                  {/* Last Payment Summary */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">Latest Payment</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-green-700">Amount:</span>
                        <span className="ml-2 font-medium text-green-900">
                          {formatCurrency(memberPaymentHistory[0]?.amount || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-green-700">Date:</span>
                        <span className="ml-2 font-medium text-green-900">
                          {formatDate(memberPaymentHistory[0]?.payment_date || memberPaymentHistory[0]?.created_at)}
                        </span>
                      </div>
                      <div>
                        <span className="text-green-700">Method:</span>
                        <span className="ml-2 font-medium text-green-900 capitalize">
                          {memberPaymentHistory[0]?.payment_method === 'mpesa' ? 'M-Pesa' :
                           memberPaymentHistory[0]?.payment_method || 'N/A'}
                        </span>
                      </div>
                      {memberPaymentHistory[0]?.processed_by_name && (
                        <div>
                          <span className="text-green-700">Processed by:</span>
                          <span className="ml-2 font-medium text-green-900">
                            {memberPaymentHistory[0].processed_by_name}
                          </span>
                        </div>
                      )}
                      {memberPaymentHistory[0]?.transaction_reference && (
                        <div>
                          <span className="text-green-700">Reference:</span>
                          <span className="ml-2 font-medium text-green-900">
                            {memberPaymentHistory[0].transaction_reference}
                          </span>
                        </div>
                      )}
                      <div>
                        <button
                          onClick={() => handleViewReceipt(memberPaymentHistory[0])}
                          className="text-green-600 hover:text-green-800 font-medium text-sm underline"
                        >
                          View Receipt
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Payment History List */}
                  {memberPaymentHistory.length > 1 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">All Payments</h4>
                      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium text-gray-700">Date</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-700">Amount</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-700">Method</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-700">Admin</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-700">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {memberPaymentHistory.map((payment, index) => (
                              <tr key={payment.id || index} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-gray-900">
                                  {formatDate(payment.payment_date || payment.created_at)}
                                </td>
                                <td className="px-4 py-2 text-gray-900 font-medium">
                                  {formatCurrency(payment.amount)}
                                </td>
                                <td className="px-4 py-2 text-gray-900 capitalize">
                                  {payment.payment_method === 'mpesa' ? 'M-Pesa' : payment.payment_method || 'N/A'}
                                </td>
                                <td className="px-4 py-2 text-gray-600">
                                  {payment.processed_by_name || 'N/A'}
                                </td>
                                <td className="px-4 py-2">
                                  <button
                                    onClick={() => handleViewReceipt(payment)}
                                    className="text-blue-600 hover:text-blue-800 font-medium underline"
                                  >
                                    Receipt
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No payment history</h3>
                  <p className="mt-1 text-sm text-gray-500">No payments found for this member.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Renewal Payment Modal */}
      <PaymentForm
        member={renewalMember}
        isOpen={showRenewalModal}
        onClose={() => setShowRenewalModal(false)}
        onPaymentSuccess={handleRenewalSuccess}
      />

      {/* Receipt Modal */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="Payment Receipt"
        size="medium"
      >
        {selectedReceipt && (
          <Receipt
            paymentData={selectedReceipt.paymentData}
            member={selectedReceipt.member}
            onClose={() => setShowReceiptModal(false)}
            onPrint={() => {
              window.print();
              setShowReceiptModal(false);
            }}
          />
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
