import React, { useState, useCallback, useMemo } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import PaymentForm from '../../components/forms/PaymentForm';
import Receipt from '../../components/ui/Receipt';
import PaymentReminder from '../../components/ui/PaymentReminder';
import Avatar from '../../components/ui/Avatar';
import { usePaymentsDue, usePaymentProcessor, usePaymentReminders } from '../../hooks/useFinancials';
import { formatCurrency, formatDate } from '../../utils/formatters';
import paymentService from '../../services/paymentService';

const PaymentsDue = () => {
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentFormModal, setShowPaymentFormModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // OPTIMIZED: Single hook handles everything
  const {
    data: payments,
    stats,
    loading,
    error,
    searchTerm,
    filterStatus,
    updateSearchTerm,
    updateFilterStatus,
    handleProcessPayment,
    handleSendReminder,
    handleBulkReminders,
    isProcessing,
    isLoading: reminderLoading,
    refetch
  } = usePaymentsDue();

  // Data is already filtered by the optimized hook
  const filteredPayments = payments || [];

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast({ show: false, message: '', type: 'success' });
  }, []);

  const handleViewPayment = useCallback((payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  }, []);

  const handleRecordPayment = useCallback((payment) => {
    setSelectedPayment(payment);
    setShowPaymentFormModal(true);
  }, []);

  const handlePaymentSuccess = useCallback((paymentResponse) => {
    setPaymentData(paymentResponse);
    setShowPaymentFormModal(false);
    setShowReceiptModal(true);
    showToast('Payment recorded successfully!', 'success');
    refetch(); // OPTIMIZED: Use refetch from hook
  }, [refetch, showToast]);

  const handleSendInvoice = useCallback((payment) => {
    setSelectedPayment(payment);
    setShowInvoiceModal(true);
  }, []);

  const handleSuspendMember = useCallback(async (payment) => {
    try {
      showToast(`Member ${payment.member_id} has been suspended due to non-payment`, 'warning');
      refetch();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }, [showToast, refetch]);

  const handleBulkInvoices = useCallback(async () => {
    try {
      const memberIds = filteredPayments.map(p => p.member_id || p.id);

      if (memberIds.length === 0) {
        showToast('No members found to send invoices to', 'warning');
        return;
      }

      const result = await paymentService.sendBulkInvoices(memberIds, {
        send_email: true,
        message: 'Payment reminder for your membership dues.',
        urgency: 'normal'
      });

      showToast(
        `Bulk invoices sent: ${result.summary.successful} successful, ${result.summary.failed} failed`,
        result.summary.failed > 0 ? 'warning' : 'success'
      );

      refetch();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }, [filteredPayments, showToast, refetch]);

  const handleDownloadInvoice = useCallback(async (payment) => {
    try {
      const memberId = payment.member_id || payment.id;
      await paymentService.downloadInvoice(memberId);
      showToast('Invoice downloaded successfully', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }, [showToast]);

  const handleReminderSent = useCallback((response) => {
    setShowReminderModal(false);
    showToast('Reminder sent successfully!', 'success');
    refetch();
  }, [showToast, refetch]);

  const handleInvoiceSent = useCallback((response) => {
    setShowInvoiceModal(false);
    if (response?.success) {
      showToast('Invoice sent successfully!', 'success');
    } else {
      showToast(response?.error || 'Failed to send invoice', 'error');
    }
    refetch();
  }, [showToast, refetch]);

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

  // Use stats from API response
  const paymentStats = useMemo(() => stats || {
    total: filteredPayments.length,
    overdue: filteredPayments.filter(p => p.status === 'overdue').length,
    dueToday: filteredPayments.filter(p => p.status === 'due_today').length,
    totalOutstanding: filteredPayments.reduce((sum, p) => sum + (p.total_outstanding || p.amount || 0), 0)
  }, [stats, filteredPayments]);

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
                <h1 className="text-2xl font-bold text-gray-900">Payments Due</h1>
                <p className="text-gray-600 mt-1">Track and manage outstanding membership payments</p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleBulkInvoices}
                  disabled={reminderLoading || filteredPayments.length === 0}
                >
                  {reminderLoading ? 'Sending...' : 'Send Bulk Invoices'}
                </Button>
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
                    onChange={(e) => updateSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex space-x-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => updateFilterStatus(e.target.value)}
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
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2">Loading payments...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                          No payments found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((payment) => (
                        <tr key={payment.id || payment.member_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 mr-4">
                              <Avatar
                                firstName={payment.first_name || payment.firstName}
                                lastName={payment.last_name || payment.lastName}
                                email={payment.email}
                                memberId={payment.member_id || `PTF${String(payment.id).padStart(4, '0')}`}
                                size="md"
                              />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {payment.first_name || payment.firstName} {payment.last_name || payment.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{payment.email}</div>
                              <div className="text-xs text-gray-400">{payment.member_id || `PTF${String(payment.id).padStart(4, '0')}`}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{payment.plan_type || payment.planType}</div>
                          <div className="mt-1">{getMembershipTypeBadge(payment.membership_type || payment.membershipType)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(payment.due_date || payment.dueDate)}</div>
                          {(payment.days_overdue || payment.daysOverdue) > 0 && (
                            <div className="text-xs text-red-600 font-medium">
                              {payment.days_overdue || payment.daysOverdue} days overdue
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(payment.total_outstanding || payment.totalOutstanding || payment.amount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Plan: {formatCurrency(payment.amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{payment.invoice_number || payment.invoiceNumber}</div>
                          <div className="text-xs text-gray-500">{payment.payment_method || payment.paymentMethod}</div>
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
                            disabled={reminderLoading}
                          >
                            {reminderLoading ? 'Sending...' : 'Invoice'}
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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
                onClick={() => handleDownloadInvoice(selectedPayment)}
                disabled={reminderLoading}
              >
                Download Invoice
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentModal(false);
                  setShowInvoiceModal(true);
                }}
                disabled={reminderLoading}
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

      {/* Payment Reminder Modal */}
      <PaymentReminder
        member={selectedPayment}
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        onReminderSent={handleReminderSent}
        mode="reminder"
      />

      {/* Invoice Modal */}
      <PaymentReminder
        member={selectedPayment}
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onReminderSent={handleInvoiceSent}
        mode="invoice"
      />

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