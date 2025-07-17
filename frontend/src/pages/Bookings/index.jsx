import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import { formatDate, formatRelativeTime } from '../../utils/formatters';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Mock data - replace with API call
  const mockBookings = [
    {
      id: 'BK001',
      memberId: 'PTF001234',
      memberName: 'John Doe',
      memberEmail: 'john.doe@email.com',
      sessionType: 'one-on-one',
      sessionDate: '2024-02-02T09:00:00Z',
      duration: 60,
      trainer: 'Mike Johnson',
      trainerSpecialty: 'Weight Training',
      status: 'confirmed',
      location: 'Indoor Gym - Room A',
      notes: 'Focus on upper body strength',
      price: 50000,
      paymentStatus: 'paid'
    },
    {
      id: 'BK002',
      memberId: 'PTF001235',
      memberName: 'Jane Smith',
      memberEmail: 'jane.smith@email.com',
      sessionType: 'group',
      sessionDate: '2024-02-02T07:00:00Z',
      duration: 45,
      trainer: 'Sarah Wilson',
      trainerSpecialty: 'Yoga',
      status: 'confirmed',
      location: 'Outdoor Area - Pavilion',
      notes: 'Morning yoga session',
      price: 25000,
      paymentStatus: 'paid',
      groupSize: 8,
      maxCapacity: 12
    },
    {
      id: 'BK003',
      memberId: 'PTF001236',
      memberName: 'Mike Johnson',
      memberEmail: 'mike.johnson@email.com',
      sessionType: 'group',
      sessionDate: '2024-02-02T18:00:00Z',
      duration: 60,
      trainer: 'Alex Thompson',
      trainerSpecialty: 'CrossFit',
      status: 'pending',
      location: 'Indoor Gym - Main Floor',
      notes: 'High intensity workout',
      price: 30000,
      paymentStatus: 'pending',
      groupSize: 5,
      maxCapacity: 10
    },
    {
      id: 'BK004',
      memberId: 'PTF001237',
      memberName: 'Sarah Wilson',
      memberEmail: 'sarah.wilson@email.com',
      sessionType: 'one-on-one',
      sessionDate: '2024-02-01T16:30:00Z',
      duration: 90,
      trainer: 'Lisa Anderson',
      trainerSpecialty: 'Rehabilitation',
      status: 'completed',
      location: 'Indoor Gym - Therapy Room',
      notes: 'Post-injury rehabilitation session',
      price: 75000,
      paymentStatus: 'paid'
    },
    {
      id: 'BK005',
      memberId: 'PTF001238',
      memberName: 'David Brown',
      memberEmail: 'david.brown@email.com',
      sessionType: 'group',
      sessionDate: '2024-02-03T06:00:00Z',
      duration: 45,
      trainer: 'Maria Garcia',
      trainerSpecialty: 'Bootcamp',
      status: 'cancelled',
      location: 'Outdoor Area - Field',
      notes: 'Cancelled due to weather',
      price: 25000,
      paymentStatus: 'refunded',
      groupSize: 0,
      maxCapacity: 15
    }
  ];

  useEffect(() => {
    setBookings(mockBookings);
    setFilteredBookings(mockBookings);
  }, []);

  useEffect(() => {
    let filtered = bookings;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.trainer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(booking => booking.status === filterStatus);
    }

    // Filter by session type
    if (filterType !== 'all') {
      filtered = filtered.filter(booking => booking.sessionType === filterType);
    }

    setFilteredBookings(filtered);
  }, [searchTerm, filterStatus, filterType, bookings]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = (bookingId) => {
    showToast(`Booking ${bookingId} confirmed successfully`, 'success');
  };

  const handleCancelBooking = (bookingId) => {
    showToast(`Booking ${bookingId} cancelled`, 'warning');
  };

  const handleRescheduleBooking = (bookingId) => {
    showToast(`Reschedule request sent for booking ${bookingId}`, 'info');
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getSessionTypeBadge = (type) => {
    const typeStyles = {
      'one-on-one': 'bg-purple-100 text-purple-800',
      'group': 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeStyles[type] || 'bg-gray-100 text-gray-800'}`}>
        {type === 'one-on-one' ? 'One-on-One' : 'Group Session'}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusStyles = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      refunded: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
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

  const getBookingStats = () => {
    const today = new Date().toDateString();
    const todayBookings = bookings.filter(booking => 
      new Date(booking.sessionDate).toDateString() === today
    );
    
    return {
      totalToday: todayBookings.length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      pending: bookings.filter(b => b.status === 'pending').length,
      revenue: bookings
        .filter(b => b.paymentStatus === 'paid')
        .reduce((sum, b) => sum + b.price, 0)
    };
  };

  const stats = getBookingStats();

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
                <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
                <p className="text-gray-600 mt-1">Manage training sessions and group classes</p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline">Export Schedule</Button>
                <Button 
                  variant="primary"
                  onClick={() => setShowNewBookingModal(true)}
                >
                  New Booking
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card
                title="Today's Sessions"
                value={stats.totalToday}
                subtitle="Scheduled for today"
              />
              <Card
                title="Confirmed Bookings"
                value={stats.confirmed}
                subtitle="Ready to go"
                className="border-green-200"
              />
              <Card
                title="Pending Approval"
                value={stats.pending}
                subtitle="Awaiting confirmation"
                className="border-yellow-200"
              />
              <Card
                title="Total Revenue"
                value={formatCurrency(stats.revenue)}
                subtitle="From paid bookings"
              />
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search bookings, members, or trainers..."
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
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="one-on-one">One-on-One</option>
                    <option value="group">Group Sessions</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Booking Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Session
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trainer
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
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {booking.id}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(booking.sessionDate)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {booking.duration} minutes
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {booking.memberName}
                            </div>
                            <div className="text-sm text-gray-500">{booking.memberEmail}</div>
                            <div className="text-xs text-gray-400">{booking.memberId}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {getSessionTypeBadge(booking.sessionType)}
                            {booking.sessionType === 'group' && (
                              <div className="text-xs text-gray-500">
                                {booking.groupSize}/{booking.maxCapacity} participants
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {booking.trainer}
                            </div>
                            <div className="text-sm text-gray-500">{booking.trainerSpecialty}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(booking.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(booking.price)}
                            </div>
                            <div className="mt-1">
                              {getPaymentStatusBadge(booking.paymentStatus)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleViewBooking(booking)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          {booking.status === 'pending' && (
                            <button
                              onClick={() => handleConfirmBooking(booking.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Confirm
                            </button>
                          )}
                          {booking.status === 'confirmed' && (
                            <>
                              <button
                                onClick={() => handleRescheduleBooking(booking.id)}
                                className="text-orange-600 hover:text-orange-900"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => handleCancelBooking(booking.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Cancel
                              </button>
                            </>
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

      {/* Booking Details Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title="Booking Details"
        size="large"
      >
        {selectedBooking && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Booking ID</label>
                    <p className="text-sm text-gray-900">{selectedBooking.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Session Date & Time</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedBooking.sessionDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Duration</label>
                    <p className="text-sm text-gray-900">{selectedBooking.duration} minutes</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-sm text-gray-900">{selectedBooking.location}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Session Type</label>
                    <div className="mt-1">{getSessionTypeBadge(selectedBooking.sessionType)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Member & Trainer</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Member Name</label>
                    <p className="text-sm text-gray-900">{selectedBooking.memberName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Member Email</label>
                    <p className="text-sm text-gray-900">{selectedBooking.memberEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Member ID</label>
                    <p className="text-sm text-gray-900">{selectedBooking.memberId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Trainer</label>
                    <p className="text-sm text-gray-900">{selectedBooking.trainer}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Trainer Specialty</label>
                    <p className="text-sm text-gray-900">{selectedBooking.trainerSpecialty}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {selectedBooking.sessionType === 'group' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Group Session Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">{selectedBooking.groupSize}</div>
                    <div className="text-sm text-gray-600">Current Participants</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">{selectedBooking.maxCapacity}</div>
                    <div className="text-sm text-gray-600">Maximum Capacity</div>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(selectedBooking.price)}</div>
                  <div className="text-sm text-gray-600">Session Price</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-lg font-medium text-gray-900">
                    {getPaymentStatusBadge(selectedBooking.paymentStatus)}
                  </div>
                  <div className="text-sm text-gray-600">Payment Status</div>
                </div>
              </div>
            </div>

            {selectedBooking.notes && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Session Notes</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">{selectedBooking.notes}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-4 border-t">
              {selectedBooking.status === 'pending' && (
                <Button
                  variant="primary"
                  onClick={() => handleConfirmBooking(selectedBooking.id)}
                >
                  Confirm Booking
                </Button>
              )}
              {selectedBooking.status === 'confirmed' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleRescheduleBooking(selectedBooking.id)}
                  >
                    Reschedule
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCancelBooking(selectedBooking.id)}
                  >
                    Cancel Booking
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* New Booking Modal */}
      <Modal
        isOpen={showNewBookingModal}
        onClose={() => setShowNewBookingModal(false)}
        title="Create New Booking"
        size="large"
      >
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏗️</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Coming Soon!</h3>
          <p className="text-gray-600">New booking creation form is under development.</p>
        </div>
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

export default Bookings;