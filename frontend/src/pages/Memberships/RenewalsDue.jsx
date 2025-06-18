import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';

const RenewalsDue = () => {
  const [renewals, setRenewals] = useState([]);
  const [filteredRenewals, setFilteredRenewals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [selectedRenewal, setSelectedRenewal] = useState(null);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Mock data - replace with API call
  const mockRenewals = [
    {
      id: 'PTF001234',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@email.com',
      phone: '+256 700 123 456',
      membershipType: 'indoor',
      currentPlan: 'Monthly Premium',
      expiryDate: '2024-02-05',
      daysUntilExpiry: 5,
      amount: 150000,
      urgency: 'critical',
      lastRenewal: '2024-01-05',
      totalRenewals: 3,
      preferredContact: 'email'
    },
    {
      id: 'PTF001235',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@email.com',
      phone: '+256 700 123 457',
      membershipType: 'outdoor',
      currentPlan: 'Quarterly Basic',
      expiryDate: '2024-02-15',
      daysUntilExpiry: 15,
      amount: 280000,
      urgency: 'high',
      lastRenewal: '2023-11-15',
      totalRenewals: 2,
      preferredContact: 'phone'
    },
    {
      id: 'PTF001236',
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@email.com',
      phone: '+256 700 123 458',
      membershipType: 'both',
      currentPlan: 'Annual Premium',
      expiryDate: '2024-02-28',
      daysUntilExpiry: 28,
      amount: 1800000,
      urgency: 'medium',
      lastRenewal: '2023-02-28',
      totalRenewals: 1,
      preferredContact: 'email'
    },
    {
      id: 'PTF001237',
      firstName: 'Sarah',
      lastName: 'Wilson',
      email: 'sarah.wilson@email.com',
      phone: '+256 700 123 459',
      membershipType: 'indoor',
      currentPlan: 'Monthly Basic',
      expiryDate: '2024-02-02',
      daysUntilExpiry: 2,
      amount: 120000,
      urgency: 'critical',
      lastRenewal: '2024-01-02',
      totalRenewals: 5,
      preferredContact: 'phone'
    }
  ];

  useEffect(() => {
    setRenewals(mockRenewals);
    setFilteredRenewals(mockRenewals);
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
  }, [searchTerm, filterUrgency, renewals]);

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

  const handleProcessRenewal = (renewalId) => {
    showToast(`Renewal process initiated for member ${renewalId}`, 'success');
  };

  const handleSendReminder = (renewalId, contactMethod) => {
    showToast(`Reminder sent via ${contactMethod} to member ${renewalId}`, 'info');
  };

  const handleBulkReminders = () => {
    showToast(`Bulk reminders sent to ${filteredRenewals.length} members`, 'success');
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
      critical: renewals.filter(r => r.urgency === 'critical').length,
      high: renewals.filter(r => r.urgency === 'high').length,
      medium: renewals.filter(r => r.urgency === 'medium').length,
      total: renewals.length
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
                  Send Bulk Reminders
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
                    {filteredRenewals.map((renewal) => (
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