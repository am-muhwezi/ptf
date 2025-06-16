import React, { useState } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import Notifications from '../../components/ui/Notifications';
import RegisterMemberForm from '../../components/forms/RegisterMemberForm';
import CheckInForm from '../../components/forms/CheckInForm';

const Dashboard = () => {
  const [membershipData] = useState({
    indoor: 150,
    outdoor: 100,
    renewalsDue: 15,
    paymentOverdue: 5
  });

  const [bookingData] = useState({
    groupSessions: 5,
    oneOnOneSessions: 5,
    trainersAvailable: 5,
    waitlistRequests: 2
  });

  const [attendanceData] = useState({
    indoorVisits: 45,
    outdoorVisits: 30
  });

  const [feedbackData] = useState({
    openTickets: 3,
    avgResolutionTime: '2 days'
  });

  const [inventoryData] = useState({
    availableStock: 1200,
    lowStockAlerts: 2
  });

  // Modal and Toast states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const notifications = [
    {
      icon: '/images/img_vector_0_1.svg',
      title: 'Announcement',
      description: 'New Year Promotion'
    },
    {
      icon: '/images/img_vector_0_4.svg',
      title: 'Membership Renewal Reminder',
      description: 'Expires in 7 days'
    },
    {
      icon: '/images/img_vector_0_gray_900_24x24.svg',
      title: 'Class Booking Reminder',
      description: 'Yoga Class at 6 PM'
    }
  ];

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  const handleRegisterMember = () => {
    setShowRegisterModal(true);
  };

  const handleCheckInMember = () => {
    setShowCheckInModal(true);
  };

  const handleRegisterSubmit = async (memberData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Registering member:', memberData);
      
      setShowRegisterModal(false);
      showToast(`Member ${memberData.firstName} ${memberData.lastName} registered successfully!`, 'success');
    } catch (error) {
      showToast('Failed to register member. Please try again.', 'error');
    }
  };

  const handleCheckInSubmit = async (checkInData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Checking in member:', checkInData);
      
      setShowCheckInModal(false);
      showToast(`${checkInData.memberName} checked in successfully!`, 'success');
    } catch (error) {
      showToast('Failed to check in member. Please try again.', 'error');
    }
  };

  const handleCardClick = (cardType, value) => {
    showToast(`${cardType}: ${value} - Detailed view would be implemented here`, 'info');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Quick Actions */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="flex space-x-4">
                <Button 
                  variant="primary" 
                  onClick={handleRegisterMember}
                  className="px-4 py-3"
                >
                  Register New Member
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={handleCheckInMember}
                  className="px-4 py-3"
                >
                  Check-in Member
                </Button>
              </div>
            </section>

            {/* Membership Management */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Membership Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                  title="Indoor Memberships"
                  value={membershipData.indoor}
                  onClick={() => handleCardClick('Indoor Memberships', membershipData.indoor)}
                />
                <Card
                  title="Outdoor Memberships"
                  value={membershipData.outdoor}
                  onClick={() => handleCardClick('Outdoor Memberships', membershipData.outdoor)}
                />
                <Card
                  title="Renewals Due"
                  value={membershipData.renewalsDue}
                  onClick={() => handleCardClick('Renewals Due', membershipData.renewalsDue)}
                />
                <Card
                  title="Payment Overdue"
                  value={membershipData.paymentOverdue}
                  onClick={() => handleCardClick('Payment Overdue', membershipData.paymentOverdue)}
                />
              </div>
            </section>

            {/* Bookings */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Bookings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                  title="Group Sessions Today"
                  value={bookingData.groupSessions}
                  onClick={() => handleCardClick('Group Sessions Today', bookingData.groupSessions)}
                />
                <Card
                  title="One-on-One Sessions Today"
                  value={bookingData.oneOnOneSessions}
                  onClick={() => handleCardClick('One-on-One Sessions Today', bookingData.oneOnOneSessions)}
                />
                <Card
                  title="Trainers Available"
                  value={bookingData.trainersAvailable}
                  onClick={() => handleCardClick('Trainers Available', bookingData.trainersAvailable)}
                />
                <Card
                  title="Waitlist Requests"
                  value={bookingData.waitlistRequests}
                  onClick={() => handleCardClick('Waitlist Requests', bookingData.waitlistRequests)}
                />
              </div>
            </section>

            {/* Attendance Logs */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Attendance Logs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                  title="Indoor Visits Today"
                  value={attendanceData.indoorVisits}
                  onClick={() => handleCardClick('Indoor Visits Today', attendanceData.indoorVisits)}
                />
                <Card
                  title="Outdoor Visits Today"
                  value={attendanceData.outdoorVisits}
                  onClick={() => handleCardClick('Outdoor Visits Today', attendanceData.outdoorVisits)}
                />
              </div>
            </section>

            {/* Complaints & Feedback */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Complaints & Feedback</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                  title="Open Tickets"
                  value={feedbackData.openTickets}
                  onClick={() => handleCardClick('Open Tickets', feedbackData.openTickets)}
                />
                <Card
                  title="Average Resolution Time"
                  value={feedbackData.avgResolutionTime}
                  onClick={() => handleCardClick('Average Resolution Time', feedbackData.avgResolutionTime)}
                />
              </div>
            </section>

            {/* Communication & Alerts */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Communication & Alerts</h2>
              <Notifications notifications={notifications} />
            </section>

            {/* Inventory & Merchandise */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Inventory & Merchandise</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                  title="Available Stock Levels"
                  value={inventoryData.availableStock}
                  onClick={() => handleCardClick('Available Stock Levels', inventoryData.availableStock)}
                />
                <Card
                  title="Low Stock Alerts"
                  value={inventoryData.lowStockAlerts}
                  onClick={() => handleCardClick('Low Stock Alerts', inventoryData.lowStockAlerts)}
                />
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Register Member Modal */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        size="large"
      >
        <RegisterMemberForm
          onSubmit={handleRegisterSubmit}
          onCancel={() => setShowRegisterModal(false)}
        />
      </Modal>

      {/* Check-in Member Modal */}
      <Modal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        size="medium"
      >
        <CheckInForm
          onSubmit={handleCheckInSubmit}
          onCancel={() => setShowCheckInModal(false)}
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

export default Dashboard;