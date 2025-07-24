import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import PaymentForm from '../../components/forms/PaymentForm';
import Receipt from '../../components/ui/Receipt';
import RegisterMemberForm from '../../components/forms/RegisterMemberForm';
import UpdateMemberProfileForm from '../../components/forms/UpdateMemberProfileForm';
import { useApi, useApiMutation } from '../../hooks/useApi';
import { memberService } from '../../services/memberService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMembershipType, setFilterMembershipType] = useState('all');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Mock data - replace with API call
  const mockMembers = [
    {
      id: 'PTF001234',
      firstName: 'Sophia',
      lastName: 'Carter',
      email: 'sophia.carter@email.com',
      phone: '+256 700 123 456',
      membershipType: 'indoor',
      planType: 'Premium',
      status: 'active',
      joinDate: '2024-01-15',
      expiryDate: '2024-07-15',
      lastVisit: '2024-01-21',
      totalVisits: 45,
      amount: 150000,
      paymentStatus: 'paid',
      address: '123 Main St, Kampala',
      dateOfBirth: '1990-05-15',
      emergencyContact: 'John Carter',
      emergencyPhone: '+256 700 123 457',
      medicalConditions: 'None',
      height: 165,
      weight: 60,
      bmi: 22.0,
      fitnessLevel: 'intermediate',
      shortTermGoals: 'Lose 5kg, improve cardio',
      longTermGoals: 'Run a marathon'
    },
    {
      id: 'PTF001235',
      firstName: 'Ethan',
      lastName: 'Bennett',
      email: 'ethan.bennett@email.com',
      phone: '+256 700 123 458',
      membershipType: 'outdoor',
      planType: 'Standard',
      status: 'active',
      joinDate: '2024-01-10',
      expiryDate: '2024-04-10',
      lastVisit: '2024-01-20',
      totalVisits: 32,
      amount: 120000,
      paymentStatus: 'paid',
      address: '456 Oak Ave, Kampala',
      dateOfBirth: '1988-08-22',
      emergencyContact: 'Sarah Bennett',
      emergencyPhone: '+256 700 123 459',
      medicalConditions: 'Mild asthma',
      height: 178,
      weight: 75,
      bmi: 23.7,
      fitnessLevel: 'advanced',
      shortTermGoals: 'Build muscle mass',
      longTermGoals: 'Compete in bodybuilding'
    },
    {
      id: 'PTF001236',
      firstName: 'Olivia',
      lastName: 'Hayes',
      email: 'olivia.hayes@email.com',
      phone: '+256 700 123 460',
      membershipType: 'both',
      planType: 'Basic',
      status: 'inactive',
      joinDate: '2023-12-01',
      expiryDate: '2024-01-01',
      lastVisit: '2023-12-28',
      totalVisits: 18,
      amount: 100000,
      paymentStatus: 'overdue',
      address: '789 Pine Rd, Kampala',
      dateOfBirth: '1995-03-10',
      emergencyContact: 'Mike Hayes',
      emergencyPhone: '+256 700 123 461',
      medicalConditions: 'Previous knee injury',
      height: 160,
      weight: 55,
      bmi: 21.5,
      fitnessLevel: 'beginner',
      shortTermGoals: 'Get back in shape',
      longTermGoals: 'Maintain healthy lifestyle'
    },
    {
      id: 'PTF001237',
      firstName: 'Liam',
      lastName: 'Foster',
      email: 'liam.foster@email.com',
      phone: '+256 700 123 462',
      membershipType: 'indoor',
      planType: 'Premium',
      status: 'active',
      joinDate: '2024-01-05',
      expiryDate: '2025-01-05',
      lastVisit: '2024-01-21',
      totalVisits: 52,
      amount: 1800000,
      paymentStatus: 'paid',
      address: '321 Elm St, Kampala',
      dateOfBirth: '1992-11-30',
      emergencyContact: 'Emma Foster',
      emergencyPhone: '+256 700 123 463',
      medicalConditions: 'None',
      height: 182,
      weight: 80,
      bmi: 24.2,
      fitnessLevel: 'advanced',
      shortTermGoals: 'Increase bench press to 100kg',
      longTermGoals: 'Become a certified trainer'
    }
  ];

  useEffect(() => {
    setMembers(mockMembers);
    setFilteredMembers(mockMembers);
  }, []);

  useEffect(() => {
    let filtered = members;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(member => member.status === filterStatus);
    }

    // Filter by membership type
    if (filterMembershipType !== 'all') {
      filtered = filtered.filter(member => member.membershipType === filterMembershipType);
    }

    setFilteredMembers(filtered);
  }, [searchTerm, filterStatus, filterMembershipType, members]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  const handleViewMember = (member) => {
    setSelectedMember(member);
    setShowMemberModal(true);
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setShowUpdateModal(true);
  };

  const handleUpdateMemberStatus = (memberId, newStatus) => {
    const updatedMembers = members.map(member =>
      member.id === memberId ? { ...member, status: newStatus } : member
    );
    setMembers(updatedMembers);
    showToast(`Member status updated to ${newStatus}`, 'success');
  };

  const handleRegisterMember = async (memberData) => {
    try {
      // In real implementation, this would call the API
      const newMember = {
        ...memberData,
        id: `PTF${Date.now()}`,
        totalVisits: 0,
        lastVisit: null,
        status: 'active',
        paymentStatus: 'paid'
      };
      
      setMembers([...members, newMember]);
      setShowRegisterModal(false);
      showToast(`${memberData.first_name} ${memberData.last_name} registered successfully!`, 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleUpdateMemberProfile = async (updatedData) => {
    try {
      const updatedMembers = members.map(member =>
        member.id === selectedMember.id ? { ...member, ...updatedData } : member
      );
      
      setMembers(updatedMembers);
      setSelectedMember({ ...selectedMember, ...updatedData });
      setShowUpdateModal(false);
      
      showToast(`Profile updated successfully for ${selectedMember.firstName} ${selectedMember.lastName}`, 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleRequestPayment = (member) => {
    setSelectedMember(member);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentResponse) => {
    setPaymentData(paymentResponse);
    setShowPaymentModal(false);
    setShowReceiptModal(true);
    
    // Update member payment status
    const updatedMembers = members.map(member =>
      member.id === selectedMember.id 
        ? { ...member, paymentStatus: 'paid', lastPayment: new Date().toISOString() }
        : member
    );
    setMembers(updatedMembers);
  };

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

  const getMemberStats = () => {
    return {
      total: members.length,
      active: members.filter(m => m.status === 'active').length,
      inactive: members.filter(m => m.status === 'inactive').length,
      indoor: members.filter(m => m.membershipType === 'indoor').length,
      outdoor: members.filter(m => m.membershipType === 'outdoor').length
    };
  };

  const stats = getMemberStats();

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
                <Button variant="outline">Export Members</Button>
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
                value={stats.total}
                subtitle="All registered"
              />
              <Card
                title="Active Members"
                value={stats.active}
                subtitle="Currently active"
                className="border-green-200"
              />
              <Card
                title="Inactive Members"
                value={stats.inactive}
                subtitle="Need attention"
                className="border-red-200"
              />
              <Card
                title="Indoor Members"
                value={stats.indoor}
                subtitle="Indoor access"
                className="border-blue-200"
              />
              <Card
                title="Outdoor Members"
                value={stats.outdoor}
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
                      placeholder="Search members"
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Membership Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan & Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
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
                                  {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {member.firstName} {member.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{member.email}</div>
                              <div className="text-xs text-gray-400">{member.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getMembershipTypeBadge(member.membershipType)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(member.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{member.planType}</div>
                          <div className="text-sm text-gray-500">{formatCurrency(member.amount)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {member.lastVisit ? formatDate(member.lastVisit) : 'Never'}
                          </div>
                          <div className="text-xs text-gray-500">{member.totalVisits} total visits</div>
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-xl font-medium text-gray-700">
                    {selectedMember.firstName.charAt(0)}{selectedMember.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedMember.firstName} {selectedMember.lastName}
                  </h3>
                  <p className="text-gray-600">Member ID: {selectedMember.id}</p>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={() => handleEditMember(selectedMember)}
              >
                Edit
              </Button>
            </div>

            {/* Personal Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-sm text-gray-900">{selectedMember.firstName} {selectedMember.lastName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-sm text-gray-900">{selectedMember.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedMember.dateOfBirth)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Join Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedMember.joinDate)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm text-gray-900">{selectedMember.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="text-sm text-gray-900">{selectedMember.address}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Membership Type</label>
                    <div className="mt-1">{getMembershipTypeBadge(selectedMember.membershipType)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedMember.status)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Name</label>
                  <p className="text-sm text-gray-900">{selectedMember.emergencyContact}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                  <p className="text-sm text-gray-900">{selectedMember.emergencyPhone}</p>
                </div>
              </div>
            </div>

            {/* Fitness Goals */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Fitness Goals</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedMember.height ? `${selectedMember.height} cm` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Weight</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedMember.weight ? `${selectedMember.weight} kg` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Short-term Goals</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedMember.bmi || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">BMI</div>
                  {selectedMember.bmi && (
                    <div className="mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBMICategory(selectedMember.bmi).style}`}>
                        {getBMICategory(selectedMember.bmi).label}
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">80%</div>
                  <div className="text-sm text-gray-600">Progress</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Short-term Goals</label>
                  <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      {selectedMember.shortTermGoals || 'No goals set yet'}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Long-term Goals</label>
                  <div className="mt-1 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-900">
                      {selectedMember.longTermGoals || 'No goals set yet'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Summary */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Activity Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">{selectedMember.totalVisits}</div>
                  <div className="text-sm text-gray-600">Total Visits</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedMember.lastVisit ? formatDate(selectedMember.lastVisit) : 'Never'}
                  </div>
                  <div className="text-sm text-gray-600">Last Visit</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.ceil((new Date(selectedMember.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))}
                  </div>
                  <div className="text-sm text-gray-600">Days Remaining</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Register Member Modal */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        size="large"
      >
        <RegisterMemberForm
          onSubmit={handleRegisterMember}
          onCancel={() => setShowRegisterModal(false)}
        />
      </Modal>

      {/* Update Member Profile Modal */}
      <Modal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        title="Update Member Profile"
        size="full"
      >
        <UpdateMemberProfileForm
          initialData={selectedMember}
          onSubmit={handleUpdateMemberProfile}
          onCancel={() => setShowUpdateModal(false)}
        />
      </Modal>

      {/* Payment Modal */}
      <PaymentForm
        member={selectedMember}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
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
          member={selectedMember}
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

export default Members;