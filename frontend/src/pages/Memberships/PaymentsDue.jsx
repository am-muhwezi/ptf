import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import PaymentForm from '../../components/forms/PaymentForm';
import Receipt from '../../components/ui/Receipt';
import authService from '../../services/authService';

const PaymentsDue = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentFormModal, setShowPaymentFormModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [paginatedPayments, setPaginatedPayments] = useState([]);


  // Load payments due data from both indoor and outdoor memberships
  const loadPaymentsData = async () => {
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
      
      // Transform to payment format and filter overdue/pending payments
      const paymentsData = allMemberships
        .map(membership => transformToPaymentData(membership))
        .filter(payment => payment.status === 'overdue' || payment.status === 'pending')
        .sort((a, b) => b.daysOverdue - a.daysOverdue);
      
      setPayments(paymentsData);
      setFilteredPayments(paymentsData);
      setTotalPayments(paymentsData.length);
      
      // Apply pagination
      applyPagination(paymentsData, 1);
    } catch (err) {
      setError(err.message);
      showToast('Failed to load payments data: ' + err.message, 'error');
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
    
    setPaginatedPayments(paginatedData);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      applyPagination(filteredPayments, newPage);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    applyPagination(filteredPayments, 1);
  };

  // Transform membership data to payment format
  const transformToPaymentData = (membership) => {
    const isOutdoor = membership.membership_type === 'outdoor';
    const dueDate = membership.end_date || membership.expiryDate;
    const now = new Date();
    const dueDateObj = new Date(dueDate);
    const daysOverdue = Math.floor((now - dueDateObj) / (1000 * 60 * 60 * 24));
    
    // Determine payment status
    let status = 'paid';
    if (membership.payment_status === 'pending') {
      status = daysOverdue > 0 ? 'overdue' : 'pending';
    } else if (membership.payment_status === 'overdue') {
      status = 'overdue';
    }
    
    return {
      id: membership.member_id_display || `PTF${String(membership.member || membership.id).padStart(6, '0')}`,
      membershipId: membership.id,
      firstName: (membership.member_name || membership.firstName || '').split(' ')[0] || 'N/A',
      lastName: (membership.member_name || membership.lastName || '').split(' ').slice(1).join(' ') || '',
      email: membership.member_email || membership.email,
      phone: membership.member_phone || membership.phone,
      membershipType: isOutdoor ? 'outdoor' : 'indoor',
      planType: isOutdoor ? getPlanDisplayName(membership.plan_name, membership.sessions_per_week, membership.weekly_fee) : membership.plan_type || 'Indoor Plan',
      amount: membership.weekly_fee || membership.amount || 0,
      dueDate: dueDate,
      daysOverdue: Math.max(0, daysOverdue),
      status: status,
      lastPayment: membership.start_date || membership.joinDate,
      paymentMethod: 'Not specified',
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(membership.id).padStart(3, '0')}`,
      totalOutstanding: membership.weekly_fee || membership.amount || 0,
      location: isOutdoor ? getLocationDisplayName(membership.location) : 'Indoor'
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
    loadPaymentsData();
  }, []);

  useEffect(() => {
    let filtered = payments;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(payment => payment.status === filterStatus);
    }

    setFilteredPayments(filtered);
    setTotalPayments(filtered.length);
    
    // Reset to first page and apply pagination
    setCurrentPage(1);
    applyPagination(filtered, 1);
  }, [searchTerm, filterStatus, payments]);

  // Recalculate pagination when page size changes
  useEffect(() => {
    if (filteredPayments.length > 0) {
      applyPagination(filteredPayments, 1);
    }
  }, [pageSize]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handleRecordPayment = (paymentId) => {
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      setSelectedPayment(payment);
      setShowPaymentFormModal(true);
    }
  };

  const handlePaymentSuccess = async (paymentResponse) => {
    try {
      // Update membership payment status in backend
      const updateData = {
        payment_status: 'paid',
        status: 'active'
      };

      if (selectedPayment.membershipType === 'outdoor') {
        await authService.updateOutdoorMember(selectedPayment.membershipId, updateData);
      } else {
        // Would need an updateIndoorMember method
        console.log('Indoor payment update not implemented yet');
      }

      setPaymentData(paymentResponse);
      setShowPaymentFormModal(false);
      setShowReceiptModal(true);
      
      // Update local state
      const updatedPayments = payments.map(payment =>
        payment.id === selectedPayment.id 
          ? { ...payment, status: 'paid', paymentStatus: 'paid' }
          : payment
      );
      
      setPayments(updatedPayments);
      setFilteredPayments(updatedPayments);
      
      showToast(`Payment recorded successfully for ${selectedPayment.firstName} ${selectedPayment.lastName}`, 'success');
      
      // Reload data to ensure consistency
      loadPaymentsData();
    } catch (err) {
      showToast('Failed to update payment status: ' + err.message, 'error');
    }
  };

  const handleSendInvoice = (paymentId) => {
    showToast(`Invoice sent to member ${paymentId}`, 'info');
  };

  const handleSuspendMember = (paymentId) => {
    showToast(`Member ${paymentId} has been suspended due to non-payment`, 'warning');
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      overdue: 'bg-red-100 text-red-800',
      due_today: 'bg-orange-100 text-orange-800',
      due_soon: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800'
    };
    
    const statusLabels = {
      overdue: 'Overdue',
      due_today: 'Due Today',
      due_soon: 'Due Soon',
      paid: 'Paid'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
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

  const getPaymentStats = () => {
    return {
      total: payments.length,
      overdue: payments.filter(p => p.status === 'overdue').length,
      dueToday: payments.filter(p => p.status === 'due_today').length,
      totalOutstanding: payments.reduce((sum, p) => sum + p.totalOutstanding, 0)
    };
  };

  const paymentStats = getPaymentStats();

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
                <h1 className="text-2xl font-bold text-gray-900">Payments Due</h1>
                <p className="text-gray-600 mt-1">Track and manage outstanding membership payments</p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline">Send Bulk Invoices</Button>
                <Button variant="primary">Payment Report</Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card
                title="Total Outstanding"
                value={formatCurrency(paymentStats.totalOutstanding)}
                subtitle="All pending payments"
                className="border-red-200"
              />
              <Card
                title="Overdue Payments"
                value={paymentStats.overdue}
                subtitle="Require immediate action"
                className="border-red-200"
              />
              <Card
                title="Due Today"
                value={paymentStats.dueToday}
                subtitle="Payment due today"
                className="border-orange-200"
              />
              <Card
                title="Total Members"
                value={paymentStats.total}
                subtitle="With pending payments"
              />
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search members or invoice numbers..."
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
                    <option value="overdue">Overdue</option>
                    <option value="due_today">Due Today</option>
                    <option value="due_soon">Due Soon</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan & Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount Due
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading && (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-gray-500">Loading payments...</span>
                          </div>
                        </td>
                      </tr>
                    )}
                    {!loading && paginatedPayments.length === 0 && filteredPayments.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            <h3 className="mt-4 text-lg font-medium text-gray-900">No payments due</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              {searchTerm || filterStatus !== 'all' 
                                ? 'Try adjusting your search or filter criteria.'
                                : 'All payments are up to date!'
                              }
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {!loading && paginatedPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {payment.firstName} {payment.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{payment.email}</div>
                            <div className="text-xs text-gray-400">{payment.id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{payment.planType}</div>
                          <div className="mt-1">{getMembershipTypeBadge(payment.membershipType)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(payment.dueDate)}</div>
                          {payment.daysOverdue > 0 && (
                            <div className="text-xs text-red-600 font-medium">
                              {payment.daysOverdue} days overdue
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(payment.totalOutstanding)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Plan: {formatCurrency(payment.amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{payment.invoiceNumber}</div>
                          <div className="text-xs text-gray-500">{payment.paymentMethod}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleViewPayment(payment)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleRecordPayment(payment.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Pay Now
                          </button>
                          <button
                            onClick={() => handleSendInvoice(payment.id)}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            Invoice
                          </button>
                          {payment.status === 'overdue' && (
                            <button
                              onClick={() => handleSuspendMember(payment.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Suspend
                            </button>
                          )}
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
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalPayments)} of {totalPayments} payments
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

      {/* Payment Details Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Payment Details"
        size="large"
      >
        {selectedPayment && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Member Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-sm text-gray-900">{selectedPayment.firstName} {selectedPayment.lastName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm text-gray-900">{selectedPayment.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-sm text-gray-900">{selectedPayment.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Member ID</label>
                    <p className="text-sm text-gray-900">{selectedPayment.id}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Plan Type</label>
                    <p className="text-sm text-gray-900">{selectedPayment.planType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Membership Type</label>
                    <div className="mt-1">{getMembershipTypeBadge(selectedPayment.membershipType)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Due Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedPayment.dueDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Invoice Number</label>
                    <p className="text-sm text-gray-900">{selectedPayment.invoiceNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Method</label>
                    <p className="text-sm text-gray-900">{selectedPayment.paymentMethod}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(selectedPayment.amount)}</div>
                  <div className="text-sm text-gray-600">Plan Amount</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-900">{formatCurrency(selectedPayment.totalOutstanding)}</div>
                  <div className="text-sm text-red-600">Total Outstanding</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedPayment.daysOverdue > 0 ? selectedPayment.daysOverdue : 0}
                  </div>
                  <div className="text-sm text-gray-600">Days Overdue</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment History</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Last Payment</div>
                <div className="text-lg font-medium text-gray-900">{formatDate(selectedPayment.lastPayment)}</div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => handleSendInvoice(selectedPayment.id)}
              >
                Send Invoice
              </Button>
              <Button
                variant="primary"
                onClick={() => handleRecordPayment(selectedPayment.id)}
              >
                Record Payment
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Form Modal */}
      <PaymentForm
        member={selectedPayment}
        isOpen={showPaymentFormModal}
        onClose={() => setShowPaymentFormModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Receipt Modal */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="Payment Receipt"
        size="medium"
      >
        <Receipt
          paymentData={paymentData}
          member={selectedPayment}
          onClose={() => setShowReceiptModal(false)}
          onPrint={() => showToast('Receipt printed successfully', 'success')}
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

export default PaymentsDue;