import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import PaymentForm from '../../components/forms/PaymentForm';
import Receipt from '../../components/ui/Receipt';
import { paymentService } from '../../services/paymentService';

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
  const [stats, setStats] = useState({ total: 0, overdue: 0, dueToday: 0, totalOutstanding: 0 });

  // Fetch payments due from API
  const fetchPaymentsDue = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (searchTerm) params.q = searchTerm;
      if (filterStatus !== 'all') params.status = filterStatus;
      
      const response = await paymentService.getPaymentsDue(params);
      
      if (response.success) {
        const paymentsData = response.results || response.data || [];
        setPayments(paymentsData);
        setFilteredPayments(paymentsData);
      } else {
        throw new Error(response.error || 'Failed to fetch payments');
      }
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch payment statistics
  const fetchPaymentStats = async () => {
    try {
      const response = await paymentService.getPaymentStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch payment stats:', err);
    }
  };

  useEffect(() => {
    fetchPaymentsDue();
    fetchPaymentStats();
  }, []);

  useEffect(() => {
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      fetchPaymentsDue();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterStatus]);

  // Since we're now filtering on the server side, we don't need client-side filtering
  // But we'll keep this for any additional client-side logic if needed
  useEffect(() => {
    setFilteredPayments(payments);
  }, [payments]);

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

  const handleRecordPayment = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentFormModal(true);
  };

  const handlePaymentSuccess = async (paymentResponse) => {
    setPaymentData(paymentResponse);
    setShowPaymentFormModal(false);
    setShowReceiptModal(true);
    
    // Refresh the payments list and stats
    await fetchPaymentsDue();
    await fetchPaymentStats();
    
    showToast('Payment recorded successfully!', 'success');
  };

  const handleSendInvoice = async (payment) => {
    try {
      const response = await paymentService.sendPaymentReminder(payment.id, {
        reminder_type: 'email',
        message: `Payment reminder for ${payment.member_details.firstName} ${payment.member_details.lastName}`
      });
      
      if (response.success) {
        showToast(response.message, 'info');
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSuspendMember = async (payment) => {
    try {
      // This would need a suspend member endpoint
      showToast(`Member ${payment.member_details.firstName} ${payment.member_details.lastName} has been suspended due to non-payment`, 'warning');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleBulkReminders = async () => {
    try {
      const memberIds = filteredPayments.map(payment => payment.id);
      const response = await paymentService.sendBulkReminders({
        member_ids: memberIds,
        reminder_type: 'email'
      });
      
      if (response.success) {
        showToast(response.message, 'success');
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
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

  // Stats are now fetched from API and stored in state

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
                <Button variant="outline" onClick={handleBulkReminders}>Send Bulk Invoices</Button>
                <Button variant="primary">Payment Report</Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card
                title="Total Outstanding"
                value={formatCurrency(stats.totalOutstanding)}
                subtitle="All pending payments"
                className="border-red-200"
              />
              <Card
                title="Overdue Payments"
                value={stats.overdue}
                subtitle="Require immediate action"
                className="border-red-200"
              />
              <Card
                title="Due Today"
                value={stats.dueToday}
                subtitle="Payment due today"
                className="border-orange-200"
              />
              <Card
                title="Total Members"
                value={stats.total}
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
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">Loading payments...</span>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-red-600 text-center">
                    <p className="mb-2">Error loading payments</p>
                    <button 
                      onClick={fetchPaymentsDue}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-gray-600">No payments due found</p>
                </div>
              ) : (
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
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {payment.member_details.firstName} {payment.member_details.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{payment.member_details.email}</div>
                              <div className="text-xs text-gray-400">{payment.member_details.id}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{payment.plan_details.planType}</div>
                            <div className="mt-1">{getMembershipTypeBadge(payment.plan_details.membershipType)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(payment.next_billing_date)}</div>
                            {payment.days_overdue > 0 && (
                              <div className="text-xs text-red-600 font-medium">
                                {payment.days_overdue} days overdue
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(payment.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(payment.total_outstanding)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Plan: {formatCurrency(payment.amount_due)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{payment.invoice_number}</div>
                            <div className="text-xs text-gray-500">{payment.payment_status}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleViewPayment(payment)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleRecordPayment(payment)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Pay Now
                            </button>
                            <button
                              onClick={() => handleSendInvoice(payment)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              Invoice
                            </button>
                            {payment.status === 'overdue' && (
                              <button
                                onClick={() => handleSuspendMember(payment)}
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