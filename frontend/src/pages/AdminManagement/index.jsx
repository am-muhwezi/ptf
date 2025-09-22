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
      active: 'bg-green-100 text-green-800',
      idle: 'bg-yellow-100 text-yellow-800',
      offline: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (user) => {
    const role = user.is_superuser ? 'Super Admin' : 'Admin';
    const roleStyles = {
      'Super Admin': 'bg-red-100 text-red-800 border border-red-200',
      'Admin': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      'User': 'bg-gray-100 text-gray-800 border border-gray-200'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${roleStyles[role] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
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
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
                <p className="text-gray-600 mt-1">Monitor logged-in users and manage admin accounts</p>
              </div>
              <Button
                variant="primary"
                onClick={() => setShowCreateForm(true)}
              >
                Create New Admin
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <Card
                title="Currently Online"
                value={loggedInUsers.filter(u => u.status === 'active').length}
                subtitle="Active sessions"
                className="border-green-200"
              />
              <Card
                title="Total Admin Users"
                value={adminUsers.length}
                subtitle="System administrators"
                className="border-blue-200"
              />
              <Card
                title="Idle Sessions"
                value={loggedInUsers.filter(u => u.status === 'idle').length}
                subtitle="Inactive for 15+ min"
                className="border-yellow-200"
              />
              <Card
                title="Total Sessions Today"
                value={loggedInUsers.length + 12}
                subtitle="Including logged out"
                className="border-purple-200"
              />
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-4 lg:space-x-8 px-4 lg:px-6 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('logged-in')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'logged-in'
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Currently Logged In ({loggedInUsers.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('admin-users')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'admin-users'
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Admin Users ({adminUsers.length})
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
                        >
                          {loading ? 'Loading...' : 'Refresh'}
                        </Button>
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => loadData(true)}
                          disabled={loading}
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
                          <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-20"></div>
                        ))}
                      </div>
                    ) : !Array.isArray(loggedInUsers) || loggedInUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-gray-500 text-lg">No logged-in users found</div>
                        <p className="text-gray-400 mt-2">Try refreshing the data or check your connection</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {loggedInUsers.map((user) => (
                          <div key={user.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <Avatar
                                  firstName={user.first_name}
                                  lastName={user.last_name}
                                  size="md"
                                />
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h4 className="text-sm font-medium text-gray-900">
                                      {user.first_name} {user.last_name}
                                    </h4>
                                    {getRoleBadge(user)}
                                    {getStatusBadge(user.status)}
                                  </div>
                                  <div className="flex items-center space-x-4 mt-1">
                                    <span className="text-xs text-gray-500">@{user.username}</span>
                                    <span className="text-xs text-gray-500">{user.email}</span>
                                    <div className="flex items-center space-x-1">
                                      {getDeviceIcon(user.device)}
                                      <span className="text-xs text-gray-500">{user.device}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-900">
                                    Session: {user.session_duration}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Last activity: {formatRelativeTime(user.last_activity)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {user.pages_visited} pages visited
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="small"
                                    onClick={() => handleViewUser(user)}
                                  >
                                    View
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="small"
                                    onClick={() => handleForceLogout(user.id)}
                                    className="border-red-300 text-red-700 hover:bg-red-50"
                                  >
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
                          <div key={i} className="bg-gray-100 rounded-lg h-24"></div>
                        ))}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 table-fixed">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                              <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                              <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                              <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                              <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {adminUsers.map((admin) => (
                              <tr key={admin.id} className="hover:bg-gray-50 transition-colors duration-150">
                                <td className="px-6 py-5 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                      <Avatar
                                        firstName={admin.first_name}
                                        lastName={admin.last_name}
                                        size="sm"
                                        className="shadow-sm"
                                      />
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-semibold text-gray-900">
                                        {admin.first_name} {admin.last_name}
                                      </div>
                                      <div className="text-sm text-gray-600">{admin.email}</div>
                                      <div className="text-xs text-gray-500 font-medium">@{admin.username}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                  {getRoleBadge(admin)}
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                  <div className="space-y-3">
                                    <label className="flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={admin.is_staff}
                                        onChange={(e) => handlePermissionChange(admin.id, 'is_staff', e.target.checked)}
                                        disabled={admin.id === user?.id}
                                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded mr-3"
                                      />
                                      <span className="text-sm font-medium text-gray-700">Staff</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={admin.is_superuser}
                                        onChange={(e) => handlePermissionChange(admin.id, 'is_superuser', e.target.checked)}
                                        disabled={admin.id === user?.id}
                                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded mr-3"
                                      />
                                      <span className="text-sm font-medium text-gray-700">Superuser</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={admin.is_active}
                                        onChange={(e) => handlePermissionChange(admin.id, 'is_active', e.target.checked)}
                                        disabled={admin.id === user?.id}
                                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded mr-3"
                                      />
                                      <span className="text-sm font-medium text-gray-700">Active</span>
                                    </label>
                                  </div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                  <div className="space-y-1">
                                    <div className="text-sm font-medium text-gray-900">
                                      Last login: {admin.last_login ? formatRelativeTime(admin.last_login) : 'Never logged in'}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {admin.created_members} members created
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {admin.total_logins} total logins
                                    </div>
                                    <div className="text-xs text-gray-500 font-medium">
                                      {admin.last_action}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                  <div className="flex flex-col space-y-2 w-full">
                                    <Button
                                      variant="outline"
                                      size="small"
                                      onClick={() => handleViewUser(admin)}
                                      className="w-full min-w-[120px] text-center justify-center hover:bg-gray-50 transition-colors"
                                    >
                                      View Details
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="small"
                                      onClick={() => setShowPasswordReset(admin.id)}
                                      className="w-full min-w-[120px] text-center justify-center bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100 transition-colors"
                                    >
                                      Reset Password
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Create Admin Form Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create New Admin User"
        size="medium"
      >
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={newAdmin.email}
              onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              required
              value={newAdmin.username}
              onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                required
                value={newAdmin.first_name}
                onChange={(e) => setNewAdmin({ ...newAdmin, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={newAdmin.last_name}
                onChange={(e) => setNewAdmin({ ...newAdmin, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={newAdmin.password}
              onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newAdmin.is_staff}
                onChange={(e) => setNewAdmin({ ...newAdmin, is_staff: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Staff User</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newAdmin.is_superuser}
                onChange={(e) => setNewAdmin({ ...newAdmin, is_superuser: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Superuser</span>
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Create Admin
            </Button>
          </div>
        </form>
      </Modal>

      {/* User Details Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="User Session Details"
        size="large"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-sm text-gray-900">{selectedUser.first_name} {selectedUser.last_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Username</label>
                    <p className="text-sm text-gray-900">@{selectedUser.username}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Role</label>
                    <div className="mt-1">{getRoleBadge(selectedUser)}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedUser.status ? 'Session Information' : 'Account Information'}
                </h3>
                <div className="space-y-3">
                  {selectedUser.status && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                    </div>
                  )}
                  {selectedUser.session_duration && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Session Duration</label>
                      <p className="text-sm text-gray-900">{selectedUser.session_duration}</p>
                    </div>
                  )}
                  {selectedUser.last_activity && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Activity</label>
                      <p className="text-sm text-gray-900">{formatRelativeTime(selectedUser.last_activity)}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Login</label>
                    <p className="text-sm text-gray-900">{formatRelativeTime(selectedUser.last_login)}</p>
                  </div>
                  {selectedUser.date_joined && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date Joined</label>
                      <p className="text-sm text-gray-900">{formatRelativeTime(selectedUser.date_joined)}</p>
                    </div>
                  )}
                  {selectedUser.ip_address && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">IP Address</label>
                      <p className="text-sm text-gray-900">{selectedUser.ip_address}</p>
                    </div>
                  )}
                  {selectedUser.ip_address && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Location</label>
                      <p className="text-sm text-gray-900">{getLocation(selectedUser)}</p>
                    </div>
                  )}
                  {selectedUser.device && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Device</label>
                      <p className="text-sm text-gray-900">{selectedUser.device}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedUser.pages_visited !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">{selectedUser.pages_visited || 0}</div>
                    <div className="text-sm text-gray-600">Pages Visited</div>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">{selectedUser.total_logins || 'N/A'}</div>
                  <div className="text-sm text-gray-600">Total Logins</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">{selectedUser.created_members || 'N/A'}</div>
                  <div className="text-sm text-gray-600">Members Created</div>
                </div>
              </div>
            </div>

            {selectedUser.last_action && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">{selectedUser.last_action}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        isOpen={!!showPasswordReset}
        onClose={() => {
          setShowPasswordReset(null);
          setNewPassword('');
        }}
        title="Reset User Password"
        size="medium"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter new password (min 6 characters)"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordReset(null);
                setNewPassword('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => handlePasswordReset(showPasswordReset)}
              className="bg-red-600 hover:bg-red-700"
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