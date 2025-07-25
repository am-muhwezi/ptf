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

  // Filter states
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

  // Payment data
  const [paymentData, setPaymentData] = useState(null);

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Fetch members data
  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterMembershipType !== 'all') params.membership_type = filterMembershipType;

      const response = await memberService.getMembers(params);
      setMembers(response.results || response); // Handle paginated or direct response
    } catch (err) {
      setError(err.message);
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterStatus, filterMembershipType]);

  // Fetch member statistics
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await memberService.getMemberStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchMembers();
    fetchStats();
  }, [fetchMembers, fetchStats]);

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
      fetchMembers(); // Refresh the list
      fetchStats(); // Refresh stats
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleRegisterMember = async (memberData) => {
    try {
      const response = await memberService.createMember(memberData);
      showToast(response.message || 'Member registered successfully!', 'success');
      setShowRegisterModal(false);
      fetchMembers(); // Refresh the list
      fetchStats(); // Refresh stats
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleUpdateMemberProfile = async (updatedData) => {
    try {
      const response = await memberService.updateMemberProfile(selectedMember.id, updatedData);
      showToast(response.message || 'Profile updated successfully', 'success');
      setShowUpdateModal(false);
      fetchMembers(); // Refresh the list
      
      // Update selected member for modal display
      const updatedMember = { ...selectedMember, ...updatedData };
      setSelectedMember(updatedMember);
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
      fetchMembers(); // Refresh the list
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
      showToast('Failed to export members data', 'error');
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
        {status.charAt(0).toUpperCase() + status.slice(1)}
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
          _filteredMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-700">
                                    {member.first_name?.charAt(0) || ''}{member.last_name?.charAt(0) || ''}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {member.full_name || `${member.first_name} ${member.last_name}`}
                                </div>
                                <div className="text-sm text-gray-500">{member.email}</div>
                                <div className="text-xs text-gray-400">{member.member_id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getMembershipTypeBadge(member.membership_type)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(member.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{member.plan_type}</div>
                            <div className="text-sm text-gray-500">{formatCurrency(member.amount)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {member.last_visit ? formatDate(member.last_visit) : 'Never'}
                            </div>
                            <div className="text-xs text-gray-500">{member.total_visits} total visits</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleViewMember(member)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleEditMember(member)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleRequestPayment(member)}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Payment
                            </button>
                            {member.payment_status === 'overdue' && (
                              <button
                                onClick={() => handleSendReminder(member)}
                                className="text-orange-600 hover:text-orange-900"
                              >
                                Remind
                              </button>
                            )}
                            {member.status === 'active' ? (
                              <button
                                onClick={() => handleUpdateMemberStatus(member.id, 'inactive')}
                                className="text-red-600 hover:text-red-900"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateMemberStatus(member.id, 'active')}
                                className="text-green-600 hover:text-green-900"
                              >
                                Activate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    }
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ================================================================================
        MODALS & TOAST
        ================================================================================
      */}
      
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={hideToast}
      />

      {/* Member Details Modal */}
      <Modal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        title="Member Details"
        size="large"
      >
        {selectedMember && (
          <div className="space-y-6">
            {/* Member Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-xl font-medium text-gray-700">
                    {selectedMember.first_name?.charAt(0) || ''}{selectedMember.last_name?.charAt(0) || ''}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedMember.full_name || `${selectedMember.first_name} ${selectedMember.last_name}`}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedMember.member_id}</p>
                </div>
              </div>
                <div className="flex flex-col items-end">
                  {getStatusBadge(selectedMember.status)}
                  <span className="mt-2">{getPaymentStatusBadge(selectedMember.payment_status)}</span>
                </div>
            </div>

            {/* Member Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div className="text-sm">
                <dt className="font-medium text-gray-500">Email Address</dt>
                <dd className="mt-1 text-gray-900">{selectedMember.email}</dd>
              </div>
              <div className="text-sm">
                <dt className="font-medium text-gray-500">Phone Number</dt>
                <dd className="mt-1 text-gray-900">{selectedMember.phone_number || 'N/A'}</dd>
              </div>
              <div className="text-sm">
                <dt className="font-medium text-gray-500">Membership</dt>
                <dd className="mt-1 text-gray-900 flex items-center">{getMembershipTypeBadge(selectedMember.membership_type)}</dd>
              </div>
              <div className="text-sm">
                <dt className="font-medium text-gray-500">Plan & Amount</dt>
                <dd className="mt-1 text-gray-900">{selectedMember.plan_type} - {formatCurrency(selectedMember.amount)}</dd>
              </div>
              <div className="text-sm">
                <dt className="font-medium text-gray-500">Join Date</dt>
                <dd className="mt-1 text-gray-900">{formatDate(selectedMember.join_date)}</dd>
              </div>
              <div className="text-sm">
                <dt className="font-medium text-gray-500">Next Payment Due</dt>
                <dd className="mt-1 text-gray-900">{formatDate(selectedMember.next_payment_date)}</dd>
              </div>
              <div className="text-sm">
                <dt className="font-medium text-gray-500">Physical Stats (Height / Weight)</dt>
                <dd className="mt-1 text-gray-900">{selectedMember.height_cm ? `${selectedMember.height_cm} cm` : 'N/A'} / {selectedMember.weight_kg ? `${selectedMember.weight_kg} kg` : 'N/A'}</dd>
              </div>
              <div className="text-sm">
                <dt className="font-medium text-gray-500">BMI Category</dt>
                <dd className="mt-1 text-gray-900">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBMICategory(selectedMember.bmi).style}`}>
                    {getBMICategory(selectedMember.bmi).label}
                  </span>
                </dd>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Register Member Modal */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="Register New Member"
      >
        <RegisterMemberForm 
          onSubmit={handleRegisterMember}
          onCancel={() => setShowRegisterModal(false)}
        />
      </Modal>

      {/* Update Member Modal */}
      <Modal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        title="Update Member Profile"
      >
        <UpdateMemberProfileForm 
          initialData={selectedMember}
          onSubmit={handleUpdateMemberProfile}
          onCancel={() => setShowUpdateModal(false)}
        />
      </Modal>

      {/* Process Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={`Process Payment for ${selectedMember?.full_name || ''}`}
      >
        <PaymentForm
          member={selectedMember}
          onSubmit={handlePaymentSuccess}
          onCancel={() => setShowPaymentModal(false)}
        />
      </Modal>

      {/* Receipt Modal */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="Payment Receipt"
      >
        <Receipt 
          member={selectedMember}
          payment={paymentData}
        />
        <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline" onClick={() => window.print()}>Print</Button>
            <Button variant="primary" onClick={() => setShowReceiptModal(false)}>Close</Button>
        </div>
      </Modal>

      {/* Send Reminder Modal */}
      <Modal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        title="Send Payment Reminder"
      >
        <PaymentReminder 
          member={selectedMember}
          onConfirm={handleReminderSent}
          onCancel={() => setShowReminderModal(false)}
        />
      </Modal>

    </div>
  );
};

export default Members;