import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import Avatar from '../../components/ui/Avatar';
import { formatDate, formatRelativeTime } from '../../utils/formatters';
import adminService from '../../services/adminService';

const AdminManagement = () => {
  const { user } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggedInUsers, setLoggedInUsers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [activeTab, setActiveTab] = useState('logged-in');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Form state for creating new admin
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    password: '',
    is_staff: true,
    is_superuser: false
  });

  useEffect(() => {
    loadData();
  }, [user, refreshTrigger]);

  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError('');

      console.log('Loading admin data...', { forceRefresh, user: user?.email });

      try {
        // Try optimized combined endpoint first
        const dashboardData = await adminService.getAdminDashboardData(forceRefresh);
        console.log('Dashboard data loaded successfully:', dashboardData);

        // Ensure we have arrays even if API returns null/undefined
        setLoggedInUsers(Array.isArray(dashboardData.loggedInAdmins) ? dashboardData.loggedInAdmins : []);
        setAdminUsers(Array.isArray(dashboardData.adminUsers) ? dashboardData.adminUsers : []);

        if (dashboardData.meta?.cached && !forceRefresh) {
          setSuccess(`Data loaded from cache (${dashboardData.meta.cache_age}s old)`);
        } else {
          setSuccess('Admin data loaded successfully');
        }
        setTimeout(() => setSuccess(''), 3000);

      } catch (combinedError) {
        console.error('API endpoint failed:', combinedError);

        // Show specific error messages and handle authentication
        if (combinedError.message.includes('Authentication required') ||
            combinedError.message.includes('401') ||
            combinedError.message.includes('login')) {
          setError('Authentication required. Redirecting to login...');
          // Redirect to landing page (where login is) after showing error briefly
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else if (combinedError.message.includes('Access denied') || combinedError.message.includes('403')) {
          setError('Access denied. Admin privileges required.');
        } else if (combinedError.message.includes('Failed to fetch') || combinedError.message.includes('NetworkError')) {
          setError('Network error. Please check your connection and try again.');
        } else {
          setError(`API Error: ${combinedError.message}`);
        }

        // Don't fall back to mock data - show empty state
        setLoggedInUsers([]);
        setAdminUsers([]);
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError(`Failed to load admin data: ${err.message}`);

      // No mock data fallback - show empty state
      setLoggedInUsers([]);
      setAdminUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await adminService.createAdminUser(newAdmin);
      setSuccess(`Admin user ${newAdmin.first_name} ${newAdmin.last_name} created successfully`);
      setShowCreateForm(false);
      setNewAdmin({
        email: '',
        username: '',
        first_name: '',
        last_name: '',
        password: '',
        is_staff: true,
        is_superuser: false
      });
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error creating admin:', err);
      setError('Failed to create admin: ' + err.message);
    }
  };

  const handlePermissionChange = async (userId, field, value) => {
    try {
      const permissions = { [field]: value };
      await adminService.updateAdminPermissions(userId, permissions);
      setSuccess(`${field.replace('_', ' ')} permission updated successfully`);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error updating permissions:', err);
      setError('Failed to update permissions: ' + err.message);
    }
  };

  const handlePasswordReset = async (userId) => {
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      await adminService.resetAdminPassword(userId, newPassword);
      setSuccess('Password reset successfully');
      setShowPasswordReset(null);
      setNewPassword('');
    } catch (err) {
      console.error('Error resetting password:', err);
      setError('Failed to reset password: ' + err.message);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete user: ${userName}?`)) {
      return;
    }

    try {
      await adminService.deleteAdminUser(userId);
      setSuccess(`User ${userName} deleted successfully`);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user: ' + err.message);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleForceLogout = async (userId) => {
    try {
      await adminService.forceLogoutUser(userId);
      setSuccess('User session terminated successfully');
      setRefreshTrigger(prev => prev + 1);
      // Refresh data after logout
      setTimeout(() => loadData(true), 1000);
    } catch (err) {
      setError('Failed to terminate session: ' + err.message);
    }
  };

  const handleInvalidateCache = async () => {
    try {
      setLoading(true);
      await adminService.invalidateCache();
      setSuccess('Cache cleared successfully - loading fresh data...');
      setTimeout(() => loadData(true), 500);
    } catch (err) {
      setError('Failed to clear cache: ' + err.message);
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      idle: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      offline: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${statusStyles[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'active' ? 'bg-green-400' : status === 'idle' ? 'bg-yellow-400' : 'bg-gray-400'}`}></div>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (user) => {
    const role = user.is_superuser ? 'Super Admin' : 'Admin';
    const roleStyles = {
      'Super Admin': 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border-red-200 shadow-sm',
      'Admin': 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200 shadow-sm',
      'User': 'bg-gray-50 text-gray-700 border-gray-200'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${roleStyles[role] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
        {role === 'Super Admin' && (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
          </svg>
        )}
        {role === 'Admin' && (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
          </svg>
        )}
        {role}
      </span>
    );
  };

  const getLocation = (user) => {
    // Compute location from IP or use default
    return user.location || 'Kampala, Uganda';
  };

  const getDeviceIcon = (device) => {
    if (device.toLowerCase().includes('iphone') || device.toLowerCase().includes('mobile')) {
      return (
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  };

  // Check for authentication - redirect to landing page if not authenticated
  if (!user) {
    window.location.href = '/?from=' + encodeURIComponent(window.location.pathname);
    return null;
  }

  // Check for superuser access - redirect to main unauthorized page
  if (!user.is_superuser && !user.isSuperuser) {
    window.location.href = '/unauthorized';
    return null;
  }

  // Debug: Log user permissions on the page
  console.log('AdminManagement - Current user:', user);
  console.log('AdminManagement - User is_staff:', user?.is_staff, 'User isStaff:', user?.isStaff);
  console.log('AdminManagement - User is_superuser:', user?.is_superuser, 'User isSuperuser:', user?.isSuperuser);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
            {/* Enhanced Page Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl shadow-sm">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Admin Management
                    </h1>
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base max-w-2xl">
                    Monitor logged-in users, manage admin accounts, and control system access
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => loadData(true)}
                    disabled={loading}
                    className="w-full sm:w-auto"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setShowCreateForm(true)}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create New Admin
                  </Button>
                </div>
              </div>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <p className="text-sm font-medium text-gray-600">Currently Online</p>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {loggedInUsers.filter(u => u.status === 'active').length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Active sessions</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Admin Users</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{adminUsers.length}</p>
                    <p className="text-xs text-gray-500 mt-1">System administrators</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Idle Sessions</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {loggedInUsers.filter(u => u.status === 'idle').length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Inactive for 15+ min</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Sessions Today</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{loggedInUsers.length + 12}</p>
                    <p className="text-xs text-gray-500 mt-1">Including logged out</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50/50">
                <nav className="flex space-x-4 lg:space-x-8 px-4 lg:px-6 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('logged-in')}
                    className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                      activeTab === 'logged-in'
                        ? 'border-emerald-500 text-emerald-600 bg-emerald-50/30'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Currently Logged In</span>
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {loggedInUsers.length}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('admin-users')}
                    className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                      activeTab === 'admin-users'
                        ? 'border-emerald-500 text-emerald-600 bg-emerald-50/30'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <span>Admin Users</span>
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {adminUsers.length}
                      </span>
                    </div>
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-4 lg:p-6">
                {activeTab === 'logged-in' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                      <h3 className="text-lg font-semibold text-gray-900">Currently Logged In Users</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => loadData(false)}
                          disabled={loading}
                          className="hover:bg-gray-50"
                        >
                          {loading ? 'Loading...' : 'Refresh'}
                        </Button>
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => loadData(true)}
                          disabled={loading}
                          className="hover:bg-blue-50 border-blue-200 text-blue-700"
                        >
                          Force Refresh
                        </Button>
                        <Button
                          variant="outline"
                          size="small"
                          onClick={handleInvalidateCache}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          disabled={loading}
                        >
                          Clear Cache
                        </Button>
                      </div>
                    </div>

                    {loading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl h-24"></div>
                        ))}
                      </div>
                    ) : !Array.isArray(loggedInUsers) || loggedInUsers.length === 0 ? (
                      <div className="text-center py-12 bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-100">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div className="text-gray-500 text-lg font-medium">No logged-in users found</div>
                        <p className="text-gray-400 mt-2">Try refreshing the data or check your connection</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {loggedInUsers.map((user) => (
                          <div key={user.id} className="bg-gradient-to-r from-white to-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                              <div className="flex items-center space-x-4">
                                <Avatar
                                  firstName={user.first_name}
                                  lastName={user.last_name}
                                  size="md"
                                  className="ring-2 ring-white shadow-sm"
                                />
                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h4 className="text-sm font-semibold text-gray-900">
                                      {user.first_name} {user.last_name}
                                    </h4>
                                    {getRoleBadge(user)}
                                    {getStatusBadge(user.status)}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center">
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                      </svg>
                                      @{user.username}
                                    </span>
                                    <span className="flex items-center">
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                      {user.email}
                                    </span>
                                    <span className="flex items-center">
                                      {getDeviceIcon(user.device)}
                                      <span className="ml-1">{user.device}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-3 sm:space-y-0">
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-gray-900 mb-1">
                                    Session: {user.session_duration}
                                  </div>
                                  <div className="text-xs text-gray-500 space-y-1">
                                    <div>Last activity: {formatRelativeTime(user.last_activity)}</div>
                                    <div>{user.pages_visited} pages visited</div>
                                  </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Button
                                    variant="outline"
                                    size="small"
                                    onClick={() => handleViewUser(user)}
                                    className="hover:bg-blue-50 border-blue-200 text-blue-700"
                                  >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="small"
                                    onClick={() => handleForceLogout(user.id)}
                                    className="border-red-300 text-red-700 hover:bg-red-50"
                                  >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Force Logout
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'admin-users' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Admin Users Management</h3>
                    </div>

                    {loading ? (
                      <div className="animate-pulse space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl h-32"></div>
                        ))}
                      </div>
                    ) : (
                      <div className="hidden lg:block overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-100">
                        <table className="min-w-full">
                          <thead className="bg-gradient-to-r from-emerald-50 via-gray-50 to-emerald-50 border-b border-gray-200">
                            <tr>
                              <th className="px-6 py-5 text-left">
                                <div className="flex items-center space-x-2">
                                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">User</span>
                                </div>
                              </th>
                              <th className="px-6 py-5 text-left">
                                <div className="flex items-center space-x-2">
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                  </svg>
                                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Role</span>
                                </div>
                              </th>
                              <th className="px-6 py-5 text-left">
                                <div className="flex items-center space-x-2">
                                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 01-2 2m2-2h-6m6 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2m0 0v6a2 2 0 01-2 2H9a2 2 0 01-2-2V7" />
                                  </svg>
                                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Permissions</span>
                                </div>
                              </th>
                              <th className="px-6 py-5 text-left">
                                <div className="flex items-center space-x-2">
                                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Activity</span>
                                </div>
                              </th>
                              <th className="px-6 py-5 text-left">
                                <div className="flex items-center space-x-2">
                                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                  </svg>
                                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</span>
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {adminUsers.map((admin, index) => (
                              <tr key={admin.id} className={`hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-emerald-50/30 transition-all duration-200 ${
                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                              }`}>
                                <td className="px-4 py-4">
                                  <div className="flex items-center space-x-3">
                                    <div className="flex-shrink-0 relative">
                                      <Avatar
                                        firstName={admin.first_name}
                                        lastName={admin.last_name}
                                        size="sm"
                                        className="ring-1 ring-white shadow-md"
                                      />
                                      {admin.is_active && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full"></div>
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center space-x-2 mb-0.5">
                                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                                          {admin.first_name} {admin.last_name}
                                        </h4>
                                        {admin.id === user?.id && (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            You
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-600 truncate">{admin.email}</div>
                                      <div className="text-xs text-gray-500">@{admin.username}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex flex-col space-y-1">
                                    {getRoleBadge(admin)}
                                    {admin.is_active ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></div>
                                        Active
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1.5"></div>
                                        Inactive
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="space-y-1.5">
                                    <div className="flex items-center space-x-2">
                                      <label className="flex items-center cursor-pointer group">
                                        <input
                                          type="checkbox"
                                          checked={admin.is_staff}
                                          onChange={(e) => handlePermissionChange(admin.id, 'is_staff', e.target.checked)}
                                          disabled={admin.id === user?.id}
                                          className="h-3.5 w-3.5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded transition-colors"
                                        />
                                        <span className="text-xs font-semibold text-gray-700 ml-1.5 group-hover:text-emerald-600">Staff</span>
                                      </label>
                                      <label className="flex items-center cursor-pointer group">
                                        <input
                                          type="checkbox"
                                          checked={admin.is_superuser}
                                          onChange={(e) => handlePermissionChange(admin.id, 'is_superuser', e.target.checked)}
                                          disabled={admin.id === user?.id}
                                          className="h-3.5 w-3.5 text-red-600 focus:ring-red-500 border-gray-300 rounded transition-colors"
                                        />
                                        <span className="text-xs font-semibold text-gray-700 ml-1.5 group-hover:text-red-600">Super</span>
                                      </label>
                                    </div>
                                    <label className="flex items-center cursor-pointer group">
                                      <input
                                        type="checkbox"
                                        checked={admin.is_active}
                                        onChange={(e) => handlePermissionChange(admin.id, 'is_active', e.target.checked)}
                                        disabled={admin.id === user?.id}
                                        className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                                      />
                                      <span className="text-xs font-semibold text-gray-700 ml-1.5 group-hover:text-blue-600">Active Account</span>
                                    </label>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center space-x-1.5">
                                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="text-xs font-medium text-gray-900">
                                        {admin.last_login ? formatRelativeTime(admin.last_login) : 'Never logged in'}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-3 text-xs text-gray-600">
                                      <span className="flex items-center">
                                        <svg className="w-2.5 h-2.5 mr-1 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        {admin.created_members || 0} members
                                      </span>
                                      <span className="flex items-center">
                                        <svg className="w-2.5 h-2.5 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                        {admin.total_logins || 0} logins
                                      </span>
                                    </div>
                                    {admin.last_action && (
                                      <div className="text-xs text-gray-500 italic truncate">
                                        {admin.last_action}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex flex-col space-y-1.5">
                                    <Button
                                      variant="outline"
                                      size="small"
                                      onClick={() => handleViewUser(admin)}
                                      className="w-full justify-center hover:bg-blue-50 border-blue-300 text-blue-700 hover:border-blue-400 transition-all duration-200 py-1.5 text-xs"
                                    >
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      Details
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="small"
                                      onClick={() => setShowPasswordReset(admin.id)}
                                      className="w-full justify-center bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 text-yellow-700 hover:from-yellow-100 hover:to-orange-100 hover:border-yellow-400 transition-all duration-200 py-1.5 text-xs"
                                    >
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 01-2 2m2-2h-6m6 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2m0 0v6a2 2 0 01-2 2H9a2 2 0 01-2-2V7" />
                                      </svg>
                                      Reset
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Mobile Admin Users Layout */}
                    <div className="lg:hidden space-y-4">
                      {adminUsers.map((admin) => (
                        <div key={admin.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex items-start space-x-4 mb-4">
                            <Avatar
                              firstName={admin.first_name}
                              lastName={admin.last_name}
                              size="sm"
                              className="ring-2 ring-white shadow-sm"
                            />
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h4 className="text-sm font-semibold text-gray-900">
                                  {admin.first_name} {admin.last_name}
                                </h4>
                                {getRoleBadge(admin)}
                              </div>
                              <div className="text-sm text-gray-600 mb-1">{admin.email}</div>
                              <div className="text-xs text-gray-500">@{admin.username}</div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Permissions</h5>
                              <div className="flex flex-wrap gap-3">
                                <label className="flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={admin.is_staff}
                                    onChange={(e) => handlePermissionChange(admin.id, 'is_staff', e.target.checked)}
                                    disabled={admin.id === user?.id}
                                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                  />
                                  <span className="text-sm font-medium text-gray-700 ml-2">Staff</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={admin.is_superuser}
                                    onChange={(e) => handlePermissionChange(admin.id, 'is_superuser', e.target.checked)}
                                    disabled={admin.id === user?.id}
                                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                  />
                                  <span className="text-sm font-medium text-gray-700 ml-2">Superuser</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={admin.is_active}
                                    onChange={(e) => handlePermissionChange(admin.id, 'is_active', e.target.checked)}
                                    disabled={admin.id === user?.id}
                                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                  />
                                  <span className="text-sm font-medium text-gray-700 ml-2">Active</span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Activity</h5>
                              <div className="text-sm space-y-1">
                                <div className="text-gray-900">
                                  Last login: {admin.last_login ? formatRelativeTime(admin.last_login) : 'Never'}
                                </div>
                                <div className="text-gray-600">
                                  {admin.created_members} members • {admin.total_logins} logins
                                </div>
                              </div>
                            </div>

                            <div className="flex space-x-2 pt-3">
                              <Button
                                variant="outline"
                                size="small"
                                onClick={() => handleViewUser(admin)}
                                className="flex-1 justify-center hover:bg-blue-50 border-blue-200 text-blue-700"
                              >
                                View Details
                              </Button>
                              <Button
                                variant="outline"
                                size="small"
                                onClick={() => setShowPasswordReset(admin.id)}
                                className="flex-1 justify-center bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                              >
                                Reset Password
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Enhanced Create Admin Form Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create New Admin User"
        size="medium"
      >
        <form onSubmit={handleCreateAdmin} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <input
                type="text"
                required
                value={newAdmin.username}
                onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="admin_username"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                required
                value={newAdmin.first_name}
                onChange={(e) => setNewAdmin({ ...newAdmin, first_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                required
                value={newAdmin.last_name}
                onChange={(e) => setNewAdmin({ ...newAdmin, last_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={newAdmin.password}
              onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Permissions</h4>
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={newAdmin.is_staff}
                  onChange={(e) => setNewAdmin({ ...newAdmin, is_staff: e.target.checked })}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700 ml-3 group-hover:text-gray-900">Staff User</span>
                <span className="text-xs text-gray-500 ml-2">(Can access admin panel)</span>
              </label>
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={newAdmin.is_superuser}
                  onChange={(e) => setNewAdmin({ ...newAdmin, is_superuser: e.target.checked })}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700 ml-3 group-hover:text-gray-900">Superuser</span>
                <span className="text-xs text-gray-500 ml-2">(Full system access)</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateForm(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
            >
              Create Admin User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Simple User Details Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="User Details"
        size="medium"
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* User Profile Section */}
            <div className="text-center pb-6 border-b border-gray-200">
              <Avatar
                firstName={selectedUser.first_name}
                lastName={selectedUser.last_name}
                size="xl"
                className="mx-auto mb-4"
              />
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedUser.first_name} {selectedUser.last_name}
              </h3>
              <p className="text-gray-600 mt-1">{selectedUser.email}</p>
              <p className="text-gray-500 text-sm">@{selectedUser.username}</p>
              <div className="mt-3">{getRoleBadge(selectedUser)}</div>
            </div>

            {/* Simple Info Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Last Login</span>
                <p className="text-gray-900 mt-1">{formatRelativeTime(selectedUser.last_login)}</p>
              </div>

              {selectedUser.date_joined && (
                <div>
                  <span className="font-medium text-gray-700">Date Joined</span>
                  <p className="text-gray-900 mt-1">{formatRelativeTime(selectedUser.date_joined)}</p>
                </div>
              )}

              {selectedUser.total_logins && (
                <div>
                  <span className="font-medium text-gray-700">Total Logins</span>
                  <p className="text-gray-900 mt-1">{selectedUser.total_logins}</p>
                </div>
              )}

              {selectedUser.created_members !== undefined && (
                <div>
                  <span className="font-medium text-gray-700">Members Created</span>
                  <p className="text-gray-900 mt-1">{selectedUser.created_members || 0}</p>
                </div>
              )}

              {selectedUser.session_duration && (
                <div>
                  <span className="font-medium text-gray-700">Session Duration</span>
                  <p className="text-gray-900 mt-1">{selectedUser.session_duration}</p>
                </div>
              )}

              {selectedUser.pages_visited !== undefined && (
                <div>
                  <span className="font-medium text-gray-700">Pages Visited</span>
                  <p className="text-gray-900 mt-1">{selectedUser.pages_visited || 0}</p>
                </div>
              )}

              {selectedUser.status && (
                <div>
                  <span className="font-medium text-gray-700">Status</span>
                  <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                </div>
              )}

              {selectedUser.last_activity && (
                <div>
                  <span className="font-medium text-gray-700">Last Activity</span>
                  <p className="text-gray-900 mt-1">{formatRelativeTime(selectedUser.last_activity)}</p>
                </div>
              )}

              {selectedUser.ip_address && (
                <div>
                  <span className="font-medium text-gray-700">IP Address</span>
                  <p className="text-gray-900 mt-1 font-mono text-xs">{selectedUser.ip_address}</p>
                </div>
              )}

              {selectedUser.device && (
                <div>
                  <span className="font-medium text-gray-700">Device</span>
                  <p className="text-gray-900 mt-1">{selectedUser.device}</p>
                </div>
              )}
            </div>

            {/* Recent Activity (if exists) */}
            {selectedUser.last_action && (
              <div className="pt-4 border-t border-gray-200">
                <span className="font-medium text-gray-700 block mb-2">Recent Activity</span>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">{selectedUser.last_action}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Enhanced Password Reset Modal */}
      <Modal
        isOpen={!!showPasswordReset}
        onClose={() => {
          setShowPasswordReset(null);
          setNewPassword('');
        }}
        title="Reset User Password"
        size="medium"
      >
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-yellow-800">Security Notice</h4>
                <p className="text-sm text-yellow-700 mt-1">This will immediately change the user's password. They will need to use the new password to log in.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="Enter new password (minimum 6 characters)"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordReset(null);
                setNewPassword('');
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => handlePasswordReset(showPasswordReset)}
              className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              Reset Password
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Messages */}
      {error && (
        <Toast
          type="error"
          message={error}
          isVisible={!!error}
          onClose={() => setError('')}
        />
      )}
      {success && (
        <Toast
          type="success"
          message={success}
          isVisible={!!success}
          onClose={() => setSuccess('')}
        />
      )}
    </div>
  );
};

export default AdminManagement;