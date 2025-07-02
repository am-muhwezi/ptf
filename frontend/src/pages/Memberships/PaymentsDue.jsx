import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';

const PaymentsDue = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Mock data - replace with API call
  const mockPayments = [
    {
      id: 'PTF001234',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@email.com',
      phone: '+256 700 123 456',
      membershipType: 'indoor',
      planType: 'Monthly Premium',
      amount: 150000,
      dueDate: '2024-01-25',
      daysOverdue: 5,
      status: 'overdue',
      lastPayment: '2023-12-25',
      paymentMethod: 'Mobile Money',
      invoiceNumber: 'INV-2024-001',
      totalOutstanding: 150000
    },
    {
      id: 'PTF001235',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@email.com',
      phone: '+256 700 123 457',
      membershipType: 'outdoor',
      planType: 'Quarterly Basic',
      amount: 280000,
      dueDate: '2024-02-01',
      daysOverdue: 0,
      status: 'due_today',
      lastPayment: '2023-11-01',
      paymentMethod: 'Bank Transfer',
      invoiceNumber: 'INV-2024-002',
      totalOutstanding: 280000
    },
    {
      id: 'PTF001236',
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@email.com',
      phone: '+256 700 123 458',
      membershipType: 'both',
      planType: 'Annual Premium',
      amount: 1800000,
      dueDate: '2024-02-05',
      daysOverdue: 0,
      status: 'due_soon',
      lastPayment: '2023-02-05',
      paymentMethod: 'Credit Card',
      invoiceNumber: 'INV-2024-003',
      totalOutstanding: 1800000
    },
    {
      id: 'PTF001237',
      firstName: 'Sarah',
      lastName: 'Wilson',
      email: 'sarah.wilson@email.com',
      phone: '+256 700 123 459',
      membershipType: 'indoor',
      planType: 'Monthly Basic',
      amount: 120000,
      dueDate: '2024-01-20',
      daysOverdue: 10,
      status: 'overdue',
      lastPayment: '2023-12-20',
      paymentMethod: 'Cash',
      invoiceNumber: 'INV-2024-004',
      totalOutstanding: 240000 // 2 months overdue
    }
  ];

  useEffect(() => {
    setPayments(mockPayments);
    setFilteredPayments(mockPayments);
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
  }, [searchTerm, filterStatus, payments]);

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
    showToast(`Payment recorded for member ${paymentId}`, 'success');
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
                    {filteredPayments.map((payment) => (
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
                            Record
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