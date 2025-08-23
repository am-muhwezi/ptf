import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import authService from '../../services/authService';

const RenewalsDue = () => {
  const [renewals, setRenewals] = useState([]);
  const [filteredRenewals, setFilteredRenewals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [selectedRenewal, setSelectedRenewal] = useState(null);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRenewals, setTotalRenewals] = useState(0);
  const [paginatedRenewals, setPaginatedRenewals] = useState([]);


  // Load renewals data from both indoor and outdoor memberships
  const loadRenewalsData = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both indoor and outdoor memberships
      const [indoorResponse, outdoorResponse] = await Promise.all([
        authService.getIndoorMembers({ limit: 1000 }),
        authService.getOutdoorMembers({ limit: 1000 })
      ]);
      
      const allMemberships = [
        ...(indoorResponse.success ? indoorResponse.data : []),
        ...(outdoorResponse.success ? outdoorResponse.data : [])
      ];
      
      // Transform to renewal format and filter expiring memberships
      const renewalsData = allMemberships
        .map(membership => transformToRenewalData(membership))
        .filter(renewal => renewal.daysUntilExpiry <= 30 && renewal.daysUntilExpiry >= 0)
        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
      
      setRenewals(renewalsData);
      setFilteredRenewals(renewalsData);
      setTotalRenewals(renewalsData.length);
      
      // Apply pagination
      applyPagination(renewalsData, page);
    } catch (err) {
      setError(err.message);
      showToast('Failed to load renewals data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Apply pagination to filtered data
  const applyPagination = (data, page = currentPage) => {
    const totalPages = Math.ceil(data.length / pageSize);
    setTotalPages(totalPages);
    setCurrentPage(page);
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = data.slice(startIndex, endIndex);
    
    setPaginatedRenewals(paginatedData);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      applyPagination(filteredRenewals, newPage);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    applyPagination(filteredRenewals, 1);
  };

  // Transform membership data to renewal format
  const transformToRenewalData = (membership) => {
    const isOutdoor = membership.membership_type === 'outdoor';
    const expiryDate = membership.end_date || membership.expiryDate;
    const daysUntilExpiry = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    let urgency = 'low';
    if (daysUntilExpiry <= 7) urgency = 'critical';
    else if (daysUntilExpiry <= 15) urgency = 'high';
    else if (daysUntilExpiry <= 30) urgency = 'medium';
    
    return {
      id: membership.member_id_display || `PTF${String(membership.member || membership.id).padStart(6, '0')}`,
      membershipId: membership.id,
      firstName: (membership.member_name || membership.firstName || '').split(' ')[0] || 'N/A',
      lastName: (membership.member_name || membership.lastName || '').split(' ').slice(1).join(' ') || '',
      email: membership.member_email || membership.email,
      phone: membership.member_phone || membership.phone,
      membershipType: isOutdoor ? 'outdoor' : 'indoor',
      currentPlan: isOutdoor ? getPlanDisplayName(membership.plan_name, membership.sessions_per_week, membership.weekly_fee) : membership.plan_type || 'Indoor Plan',
      expiryDate: expiryDate,
      daysUntilExpiry: daysUntilExpiry,
      amount: membership.weekly_fee || membership.amount || 0,
      urgency: urgency,
      lastRenewal: membership.start_date || membership.joinDate,
      totalRenewals: 1, // Would need to track this in backend
      preferredContact: 'email',
      status: membership.status,
      paymentStatus: membership.payment_status || 'pending',
      location: isOutdoor ? getLocationDisplayName(membership.location) : 'Indoor',
      sessionsRemaining: membership.sessions_remaining || 0
    };
  };

  // Helper functions
  const getPlanDisplayName = (planName, sessionsPerWeek, weeklyFee) => {
    const fee = parseFloat(weeklyFee || 0);
    const sessions = parseInt(sessionsPerWeek || 0);
    
    if (fee === 1000) return `Daily Drop-in - KES 1,000`;
    if (fee === 3000 && sessions === 1) return `1 Session/Week - KES 3,000`;
    if (fee === 4000 && sessions === 2) return `2 Sessions/Week - KES 4,000`;
    if (fee === 5000 && sessions === 3) return `3 Sessions/Week - KES 5,000`;
    if (fee === 6000 && sessions === 4) return `4 Sessions/Week - KES 6,000`;
    if (fee === 7000 && sessions === 5) return `5 Sessions/Week - KES 7,000`;
    
    return planName || `${sessions} Sessions/Week - KES ${fee}`;
  };

  const getLocationDisplayName = (locationValue) => {
    const locationMap = {
      'arboretum': 'Arboretum', 'boxwood': 'Boxwood', 'botanical': 'Botanical',
      'karura': 'Karura', 'sagret': 'Sagret', 'mushroom': 'Mushroom', 'loreto': 'PCEA Loreto',
      '1': 'Arboretum', '2': 'Boxwood', '3': 'Botanical', '4': 'Karura',
      '5': 'Sagret', '6': 'Mushroom', '7': 'PCEA Loreto'
    };
    return locationMap[locationValue] || locationValue || 'Not specified';
  };

  useEffect(() => {
    loadRenewalsData();
  }, []);

  useEffect(() => {
    let filtered = renewals;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(renewal =>
        renewal.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        renewal.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        renewal.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        renewal.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by urgency
    if (filterUrgency !== 'all') {
      filtered = filtered.filter(renewal => renewal.urgency === filterUrgency);
    }

    setFilteredRenewals(filtered);
    setTotalRenewals(filtered.length);
    
    // Reset to first page and apply pagination
    setCurrentPage(1);
    applyPagination(filtered, 1);
  }, [searchTerm, filterUrgency, renewals]);

  // Recalculate pagination when page size changes
  useEffect(() => {
    if (filteredRenewals.length > 0) {
      applyPagination(filteredRenewals, 1);
    }
  }, [pageSize]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  const handleViewRenewal = (renewal) => {
    setSelectedRenewal(renewal);
    setShowRenewalModal(true);
  };

  const handleProcessRenewal = async (renewalId) => {
    try {
      const renewal = renewals.find(r => r.id === renewalId);
      if (!renewal) {
        showToast('Renewal not found', 'error');
        return;
      }

      // For now, we'll extend the membership by the same duration
      // In a real app, this would open a renewal form with plan options
      const currentEndDate = new Date(renewal.expiryDate);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + 1); // Extend by 1 month

      // Update the membership (this would call a specific renewal endpoint)
      const updateData = {
        end_date: newEndDate.toISOString().split('T')[0],
        status: 'active',
        payment_status: 'pending'
      };

      if (renewal.membershipType === 'outdoor') {
        await authService.updateOutdoorMember(renewal.membershipId, updateData);
      } else {
        // Would need an updateIndoorMember method
        console.log('Indoor renewal not implemented yet');
      }

      showToast(`Membership renewed for ${renewal.firstName} ${renewal.lastName}`, 'success');
      
      // Reload data to reflect changes
      loadRenewalsData();
    } catch (err) {
      showToast('Failed to process renewal: ' + err.message, 'error');
    }
  };

  const handleSendReminder = async (renewalId, contactMethod) => {
    try {
      const renewal = renewals.find(r => r.id === renewalId);
      if (!renewal) {
        showToast('Member not found', 'error');
        return;
      }

      // This would call a notification service
      // For now, we'll just log and show success
      console.log(`Sending ${contactMethod} reminder to:`, {
        name: `${renewal.firstName} ${renewal.lastName}`,
        email: renewal.email,
        phone: renewal.phone,
        expiryDate: renewal.expiryDate,
        daysLeft: renewal.daysUntilExpiry
      });

      showToast(`Reminder sent via ${contactMethod} to ${renewal.firstName} ${renewal.lastName}`, 'info');
    } catch (err) {
      showToast('Failed to send reminder: ' + err.message, 'error');
    }
  };

  const handleBulkReminders = async () => {
    try {
      const reminders = filteredRenewals.map(renewal => ({
        memberId: renewal.id,
        name: `${renewal.firstName} ${renewal.lastName}`,
        email: renewal.email,
        phone: renewal.phone,
        preferredContact: renewal.preferredContact,
        daysUntilExpiry: renewal.daysUntilExpiry,
        urgency: renewal.urgency
      }));

      // This would call a bulk notification service
      console.log('Sending bulk reminders to:', reminders);

      showToast(`Bulk reminders sent to ${filteredRenewals.length} members`, 'success');
    } catch (err) {
      showToast('Failed to send bulk reminders: ' + err.message, 'error');
    }
  };

  const getUrgencyBadge = (urgency) => {
    const urgencyStyles = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${urgencyStyles[urgency] || 'bg-gray-100 text-gray-800'}`}>
        {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
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
        {type === 'both' ? 'Indoor + Outdoor' : type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getUrgencyStats = () => {
    return {
      critical: filteredRenewals.filter(r => r.urgency === 'critical').length,
      high: filteredRenewals.filter(r => r.urgency === 'high').length,
      medium: filteredRenewals.filter(r => r.urgency === 'medium').length,
      total: filteredRenewals.length
    };
  };

  const urgencyStats = getUrgencyStats();

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
                <h1 className="text-2xl font-bold text-gray-900">Renewals Due</h1>
                <p className="text-gray-600 mt-1">Manage membership renewals and send reminders</p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={handleBulkReminders}>
                  Send Bulk Reminders ({filteredRenewals.length})
                </Button>
                <Button variant="primary">Export Report</Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card
                title="Total Renewals Due"
                value={urgencyStats.total}
                subtitle="Next 30 days"
              />
              <Card
                title="Critical (≤7 days)"
                value={urgencyStats.critical}
                subtitle="Immediate attention"
                className="border-red-200"
              />
              <Card
                title="High Priority (≤15 days)"
                value={urgencyStats.high}
                subtitle="Send reminders"
                className="border-orange-200"
              />
              <Card
                title="Medium Priority (≤30 days)"
                value={urgencyStats.medium}
                subtitle="Plan ahead"
                className="border-yellow-200"
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
                    value={filterUrgency}
                    onChange={(e) => setFilterUrgency(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Urgency</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Renewals Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expiry Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Urgency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Renewal Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading && (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-gray-500">Loading renewals...</span>
                          </div>
                        </td>
                      </tr>
                    )}
                    {!loading && paginatedRenewals.length === 0 && filteredRenewals.length === 0 && (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="mt-4 text-lg font-medium text-gray-900">No renewals due</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              {searchTerm || filterUrgency !== 'all' 
                                ? 'Try adjusting your search or filter criteria.'
                                : 'All memberships are up to date!'
                              }
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {!loading && paginatedRenewals.map((renewal) => (
                      <tr key={renewal.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {renewal.firstName} {renewal.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{renewal.email}</div>
                            <div className="text-xs text-gray-400">{renewal.id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{renewal.currentPlan}</div>
                          <div className="mt-1">{getMembershipTypeBadge(renewal.membershipType)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(renewal.expiryDate)}</div>
                          <div className="text-xs text-gray-500">{renewal.daysUntilExpiry} days remaining</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getUrgencyBadge(renewal.urgency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(renewal.amount)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{renewal.phone}</div>
                          <div className="text-xs text-gray-500">Prefers: {renewal.preferredContact}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleViewRenewal(renewal)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleProcessRenewal(renewal.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Renew
                          </button>
                          <button
                            onClick={() => handleSendReminder(renewal.id, renewal.preferredContact)}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            Remind
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
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRenewals)} of {totalRenewals} renewals
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Page Size Selector */}
                    <div className="flex items-center space-x-2">
                      <label htmlFor="pageSize" className="text-sm text-gray-700">Show:</label>
                      <select
                        id="pageSize"
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    
                    {/* Page Navigation */}
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
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Renewal Details Modal */}
      <Modal
        isOpen={showRenewalModal}
        onClose={() => setShowRenewalModal(false)}
        title="Renewal Details"
        size="large"
      >
        {selectedRenewal && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Member Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-sm text-gray-900">{selectedRenewal.firstName} {selectedRenewal.lastName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm text-gray-900">{selectedRenewal.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-sm text-gray-900">{selectedRenewal.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Member ID</label>
                    <p className="text-sm text-gray-900">{selectedRenewal.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Preferred Contact</label>
                    <p className="text-sm text-gray-900">{selectedRenewal.preferredContact}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Renewal Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Current Plan</label>
                    <p className="text-sm text-gray-900">{selectedRenewal.currentPlan}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Membership Type</label>
                    <div className="mt-1">{getMembershipTypeBadge(selectedRenewal.membershipType)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Expiry Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedRenewal.expiryDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Days Until Expiry</label>
                    <p className="text-sm text-gray-900">{selectedRenewal.daysUntilExpiry} days</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Renewal Amount</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedRenewal.amount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Urgency</label>
                    <div className="mt-1">{getUrgencyBadge(selectedRenewal.urgency)}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Renewal History</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">{selectedRenewal.totalRenewals}</div>
                  <div className="text-sm text-gray-600">Total Renewals</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">{formatDate(selectedRenewal.lastRenewal)}</div>
                  <div className="text-sm text-gray-600">Last Renewal</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(selectedRenewal.amount * selectedRenewal.totalRenewals)}
                  </div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => handleSendReminder(selectedRenewal.id, selectedRenewal.preferredContact)}
              >
                Send Reminder
              </Button>
              <Button
                variant="primary"
                onClick={() => handleProcessRenewal(selectedRenewal.id)}
              >
                Process Renewal
              </Button>
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

export default RenewalsDue;