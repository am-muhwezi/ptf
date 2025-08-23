import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import apiClient from '../../config/api';

const Profile = () => {
  const { user } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || user.firstName || '',
        last_name: user.last_name || user.lastName || '',
        email: user.email || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email
      };

      const response = await apiClient.put('/auth/profile/', updateData);
      
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Update local storage with new data
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      const updatedUserData = {
        ...userData,
        first_name: formData.first_name,
        last_name: formData.last_name,
        firstName: formData.first_name,
        lastName: formData.last_name,
        email: formData.email
      };
      localStorage.setItem('user_data', JSON.stringify(updatedUserData));
      
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (formData.new_password !== formData.confirm_password) {
      setMessage('New passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (formData.new_password.length < 6) {
      setMessage('New password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      const passwordData = {
        current_password: formData.current_password,
        new_password: formData.new_password
      };

      await apiClient.post('/auth/password/change/', passwordData);
      
      setMessage('Password changed successfully!');
      setShowPasswordFields(false);
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
      
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleDisplay = () => {
    if (user?.is_superuser) return 'Super Administrator';
    if (user?.is_staff) return 'Staff Member';
    return 'User';
  };

  const getRoleBadgeColor = () => {
    if (user?.is_superuser) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (user?.is_staff) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const firstInitial = user.firstName?.charAt(0) || user.first_name?.charAt(0) || user.email?.charAt(0) || 'U';
    const lastInitial = user.lastName?.charAt(0) || user.last_name?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {getUserInitials()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {user.firstName || user.first_name} {user.lastName || user.last_name}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor()}`}>
                    {getRoleDisplay()}
                  </span>
                  <span className="text-sm text-gray-500">{user.email}</span>
                </div>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('successfully') 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          {isEditing ? (
            <div className="space-y-6">
              {/* Profile Form */}
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setShowPasswordFields(false);
                      setMessage('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              {/* Password Change Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Change Password</h3>
                  <button
                    onClick={() => setShowPasswordFields(!showPasswordFields)}
                    className="text-sm text-emerald-600 hover:text-emerald-700"
                  >
                    {showPasswordFields ? 'Cancel' : 'Change Password'}
                  </button>
                </div>

                {showPasswordFields && (
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        name="current_password"
                        value={formData.current_password}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          name="new_password"
                          value={formData.new_password}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          name="confirm_password"
                          value={formData.confirm_password}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? 'Changing...' : 'Change Password'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Profile Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
                    <p className="text-gray-800">{user.firstName || user.first_name} {user.lastName || user.last_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                    <p className="text-gray-800">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Username</label>
                    <p className="text-gray-800">{user.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
                    <span className={`inline-block px-2 py-1 text-sm font-medium rounded-full border ${getRoleBadgeColor()}`}>
                      {getRoleDisplay()}
                    </span>
                  </div>
                  {user.dateJoined && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Member Since</label>
                      <p className="text-gray-800">{new Date(user.dateJoined).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Permissions */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Permissions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium text-gray-700">Active Account</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${user.is_staff ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm font-medium text-gray-700">Staff Access</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${user.is_superuser ? 'bg-purple-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm font-medium text-gray-700">Super Administrator</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;