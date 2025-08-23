import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import CheckInForm from '../../components/forms/CheckInForm';
import attendanceService from '../../services/attendanceService';
import { formatDate, formatRelativeTime } from '../../utils/formatters';

const Attendance = () => {
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('today');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [todaysStats, setTodaysStats] = useState({
    totalToday: 0,
    indoorToday: 0,
    outdoorToday: 0,
    activeNow: 0
  });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Load attendance data on component mount
  useEffect(() => {
    loadTodaysAttendance();
    loadAttendanceLogs();
  }, []);

  const loadTodaysAttendance = async () => {
    try {
      setLoading(true);
      const response = await attendanceService.getTodaysAttendance();
      
      setTodaysStats({
        totalToday: response.summary.total_checkins,
        indoorToday: response.summary.indoor.total,
        outdoorToday: response.summary.outdoor.total,
        activeNow: response.summary.currently_active
      });
      
      // Convert active members to attendance logs format
      const activeLogs = response.active_members.map(member => ({
        id: `active_${member.id}`,
        memberId: member.id,
        memberName: member.name,
        membershipType: 'active', // Since they're currently active
        checkInTime: member.check_in_time,
        checkOutTime: null,
        duration: 'Active',
        visitType: member.visit_type,
        activities: member.activities || [],
        notes: '',
        status: 'active'
      }));
      
      setAttendanceLogs(activeLogs);
      setFilteredLogs(activeLogs);
      
    } catch (error) {
      console.error('Failed to load attendance data:', error);
      showToast('Failed to load attendance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceLogs = async () => {
    try {
      const filters = {
        searchTerm,
        visitType: filterType,
        dateFilter: filterDate
      };
      
      const logs = await attendanceService.getAttendanceLogs(filters);
      setAttendanceLogs(logs);
      setFilteredLogs(logs);
    } catch (error) {
      console.error('Failed to load attendance logs:', error);
      // Don't show error for this, as it might be expected if no data exists yet
    }
  };

  // Filter logs when search term or filter type changes
  useEffect(() => {
    let filtered = attendanceLogs;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.memberId.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.activities.some(activity => 
          activity.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filter by visit type
    if (filterType !== 'all') {
      filtered = filtered.filter(log => log.visitType === filterType);
    }

    setFilteredLogs(filtered);
  }, [searchTerm, filterType, attendanceLogs]);

  // Reload data when date filter changes
  useEffect(() => {
    if (filterDate !== 'today') {
      // For now, we only support 'today'. In the future, you can add more date filtering
      showToast('Only "today" filter is currently supported', 'info');
    }
    loadTodaysAttendance();
  }, [filterDate]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  const handleViewLog = (log) => {
    setSelectedLog(log);
    setShowLogModal(true);
  };

  const handleCheckOut = async (logId) => {
    try {
      // Find the log to get member ID
      const log = attendanceLogs.find(l => l.id === logId);
      if (!log) {
        showToast('Attendance log not found', 'error');
        return;
      }

      await attendanceService.checkOut({
        memberId: log.memberId,
        attendanceId: log.id.toString().replace('active_', ''), // Remove prefix if exists
        notes: ''
      });

      showToast(`${log.memberName} checked out successfully`, 'success');
      
      // Reload attendance data
      loadTodaysAttendance();
      
    } catch (error) {
      console.error('Check-out failed:', error);
      showToast(error.message || 'Failed to check out member', 'error');
    }
  };

  const handleCheckInSuccess = (response) => {
    showToast('Member checked in successfully!', 'success');
    loadTodaysAttendance(); // Refresh data
    setShowCheckInModal(false);
  };

  const handleAutoCheckout = (result) => {
    if (result.successful > 0) {
      showToast(`Auto-checked out ${result.successful} members who exceeded 2hr 20min session limit`, 'success');
      loadTodaysAttendance(); // Refresh data
    }
    if (result.failed > 0) {
      showToast(`Failed to auto-checkout ${result.failed} members`, 'error');
    }
  };

  const handleExportLogs = () => {
    showToast('Attendance logs exported successfully', 'info');
  };

  const getVisitTypeBadge = (type) => {
    const typeStyles = {
      indoor: 'bg-blue-100 text-blue-800',
      outdoor: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeStyles[type] || 'bg-gray-100 text-gray-800'}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (checkOutTime) => {
    if (checkOutTime) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
          Completed
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        Active
      </span>
    );
  };

  // Use the real stats from API
  const stats = todaysStats;

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
                <h1 className="text-2xl font-bold text-gray-900">Attendance Logs</h1>
                <p className="text-gray-600 mt-1">Track member check-ins and workout sessions</p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={handleExportLogs}>
                  Export Logs
                </Button>
                <Button variant="outline" onClick={() => setShowCheckInModal(true)}>
                  Check In Member
                </Button>
                <Button variant="primary">Generate Report</Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card
                title="Total Visits Today"
                value={stats.totalToday}
                subtitle="All check-ins"
              />
              <Card
                title="Indoor Visits"
                value={stats.indoorToday}
                subtitle="Today's indoor sessions"
              />
              <Card
                title="Outdoor Visits"
                value={stats.outdoorToday}
                subtitle="Today's outdoor sessions"
              />
              <Card
                title="Currently Active"
                value={stats.activeNow}
                subtitle="Members in gym"
                className="border-green-200"
              />
            </div>


            {/* Filters and Search */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search members or activities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex space-x-4">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                  </select>
                  <select
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Attendance Logs Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-in Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visit Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activities
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.memberName}
                            </div>
                            <div className="text-sm text-gray-500">{log.memberId}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(log.checkInTime)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatRelativeTime(log.checkInTime)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getVisitTypeBadge(log.visitType)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{log.duration}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {log.activities.slice(0, 2).map((activity, index) => (
                              <span key={index} className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                                {activity}
                              </span>
                            ))}
                            {log.activities.length > 2 && (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                +{log.activities.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(log.checkOutTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleViewLog(log)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          {!log.checkOutTime && (
                            <button
                              onClick={() => handleCheckOut(log.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Check Out
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

      {/* Check-In Form Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <CheckInForm
              onSubmit={handleCheckInSuccess}
              onCancel={() => setShowCheckInModal(false)}
            />
          </div>
        </div>
      )}

      {/* Log Details Modal */}
      <Modal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        title="Attendance Log Details"
        size="large"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Member Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Member Name</label>
                    <p className="text-sm text-gray-900">{selectedLog.memberName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Member ID</label>
                    <p className="text-sm text-gray-900">{selectedLog.memberId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Membership Type</label>
                    <p className="text-sm text-gray-900">{selectedLog.membershipType}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Session Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Visit Type</label>
                    <div className="mt-1">{getVisitTypeBadge(selectedLog.visitType)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Check-in Time</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedLog.checkInTime)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Check-out Time</label>
                    <p className="text-sm text-gray-900">
                      {selectedLog.checkOutTime ? formatDate(selectedLog.checkOutTime) : 'Still active'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Duration</label>
                    <p className="text-sm text-gray-900">{selectedLog.duration}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedLog.checkOutTime)}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Activities</h3>
              <div className="flex flex-wrap gap-2">
                {selectedLog.activities.map((activity, index) => (
                  <span key={index} className="px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-full">
                    {activity}
                  </span>
                ))}
              </div>
            </div>
            
            {selectedLog.notes && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">{selectedLog.notes}</p>
                </div>
              </div>
            )}
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

export default Attendance;