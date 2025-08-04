import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';

const AdminManagement = () => {
  const { user } = useAuthContext();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(null);
  const [newPassword, setNewPassword] = useState('');

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
    if (user?.is_superuser) {
      fetchAdmins();
    }
  }, [user]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAdminUsers();
      setAdmins(response.admins || []);
    } catch (err) {
      setError('Failed to fetch admin users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      const response = await adminService.createAdminUser(newAdmin);
      setSuccess(response.message);
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
      fetchAdmins();
    } catch (err) {
      setError('Failed to create admin: ' + err.message);
    }
  };

  const handlePermissionChange = async (adminId, field, value) => {
    try {
      const permissions = { [field]: value };
      const response = await adminService.updateAdminPermissions(adminId, permissions);
      setSuccess(response.message);
      fetchAdmins();
    } catch (err) {
      setError('Failed to update permissions: ' + err.message);
    }
  };

  const handlePasswordReset = async (adminId) => {
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      const response = await adminService.resetAdminPassword(adminId, newPassword);
      setSuccess(response.message);
      setShowPasswordReset(null);
      setNewPassword('');
    } catch (err) {
      setError('Failed to reset password: ' + err.message);
    }
  };

  const handleDeleteAdmin = async (adminId, adminName) => {
    if (!confirm(`Are you sure you want to delete admin: ${adminName}?`)) {
      return;
    }

    try {
      const response = await adminService.deleteAdminUser(adminId);
      setSuccess(response.message);
      fetchAdmins();
    } catch (err) {
      setError('Failed to delete admin: ' + err.message);
    }
  };

  if (!user?.is_superuser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600">You need superadmin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600 mt-2">Manage admin users and their permissions</p>
        </div>

        {/* Toast Messages */}
        {error && (
          <Toast
            type="error"
            message={error}
            onClose={() => setError('')}
          />
        )}
        {success && (
          <Toast
            type="success"
            message={success}
            onClose={() => setSuccess('')}
          />
        )}

        {/* Create Admin Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg"
          >
            Create New Admin
          </Button>
        </div>

        {/* Create Admin Form */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4">Create New Admin</h2>
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
                    onClick={() => setShowCreateForm(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"
                  >
                    Create Admin
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Password Reset Modal */}
        {showPasswordReset && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4">Reset Password</h2>
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
                    onClick={() => {
                      setShowPasswordReset(null);
                      setNewPassword('');
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handlePasswordReset(showPasswordReset)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                  >
                    Reset Password
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Users Table */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Admin Users ({admins.length})</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading admin users...</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No admin users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {admins.map((admin) => (
                    <tr key={admin.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {admin.first_name} {admin.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{admin.email}</div>
                          <div className="text-xs text-gray-400">@{admin.username}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          admin.is_superuser 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {admin.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={admin.is_staff}
                              onChange={(e) => handlePermissionChange(admin.id, 'is_staff', e.target.checked)}
                              disabled={admin.id === user?.id}
                              className="mr-2"
                            />
                            <span className="text-gray-700">Staff</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={admin.is_superuser}
                              onChange={(e) => handlePermissionChange(admin.id, 'is_superuser', e.target.checked)}
                              disabled={admin.id === user?.id}
                              className="mr-2"
                            />
                            <span className="text-gray-700">Superuser</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={admin.is_active}
                              onChange={(e) => handlePermissionChange(admin.id, 'is_active', e.target.checked)}
                              disabled={admin.id === user?.id}
                              className="mr-2"
                            />
                            <span className="text-gray-700">Active</span>
                          </label>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {admin.last_login_formatted}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-y-2">
                        <Button
                          onClick={() => setShowPasswordReset(admin.id)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs w-full"
                        >
                          Reset Password
                        </Button>
                        {admin.id !== user?.id && (
                          <Button
                            onClick={() => handleDeleteAdmin(admin.id, `${admin.first_name} ${admin.last_name}`)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs w-full"
                          >
                            Delete
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;