import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import { formatRelativeTime } from '../../utils/formatters';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const [loggedInAdmins, setLoggedInAdmins] = useState([]);
  const [sessionStats, setSessionStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdminInfo, setShowAdminInfo] = useState(false);

  useEffect(() => {
    // Show admin info if user is staff (has some admin privileges)
    if (user?.is_staff || user?.isStaff) {
      setShowAdminInfo(true);
      loadAdminInfo();
    }
  }, [user]);

  const loadAdminInfo = async () => {
    try {
      setLoading(true);
      const [loggedInData, statsData] = await Promise.all([
        adminService.getLoggedInAdmins(),
        adminService.getSessionStats()
      ]);

      setLoggedInAdmins(loggedInData.logged_in_admins || []);
      setSessionStats(statsData.stats || {});
    } catch (err) {
      setError('Failed to load admin information');
      console.error('Error loading admin info:', err);
    } finally {
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
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusStyles[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4 py-8">
      <div className={`w-full text-center ${showAdminInfo ? 'max-w-6xl' : 'max-w-md'}`}>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Error Icon */}
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            You don't have permission to access this resource.
            {user && (
              <span className="block mt-2 text-sm">
                Logged in as: <strong>{user.firstName || user.first_name} {user.lastName || user.last_name}</strong>
                {(user.is_staff || user.isStaff) && <span className="text-blue-600"> (Staff)</span>}
                {(user.is_superuser || user.isSuperuser) && <span className="text-red-600"> (Superuser)</span>}
              </span>
            )}
          </p>

          <div className={`grid gap-8 ${showAdminInfo ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
            {/* User Permissions Section */}
            {user && (
              <div className="text-left">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Your Permissions:</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-3 ${(user.is_active ?? user.isActive) ? 'bg-green-400' : 'bg-red-400'}`}></span>
                      Account Status: <span className="font-medium ml-1">{(user.is_active ?? user.isActive) ? 'Active' : 'Inactive'}</span>
                    </li>
                    <li className="flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-3 ${(user.is_staff || user.isStaff) ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                      Staff Access: <span className="font-medium ml-1">{(user.is_staff || user.isStaff) ? 'Yes' : 'No'}</span>
                    </li>
                    <li className="flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-3 ${(user.is_superuser || user.isSuperuser) ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                      Superuser Access: <span className="font-medium ml-1">{(user.is_superuser || user.isSuperuser) ? 'Yes' : 'No'}</span>
                    </li>
                  </ul>

                </div>
              </div>
            )}

            {/* Admin Information Section */}
            {showAdminInfo && (
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Currently Logged In Admins</h3>

                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-16"></div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 text-sm">{error}</p>
                    <Button
                      onClick={loadAdminInfo}
                      className="mt-2 text-xs bg-red-100 text-red-700 hover:bg-red-200"
                      size="small"
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Quick Stats */}
                    {Object.keys(sessionStats).length > 0 && (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-green-800">{sessionStats.currently_online || 0}</div>
                          <div className="text-xs text-green-600">Online</div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-blue-800">{sessionStats.total_admin_users || 0}</div>
                          <div className="text-xs text-blue-600">Total Admins</div>
                        </div>
                      </div>
                    )}

                    {/* Admin List */}
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {loggedInAdmins.length > 0 ? (
                        loggedInAdmins.map((admin) => (
                          <div key={admin.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Avatar
                                  firstName={admin.first_name}
                                  lastName={admin.last_name}
                                  size="sm"
                                />
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <p className="text-sm font-medium text-gray-900">
                                      {admin.first_name} {admin.last_name}
                                      {admin.is_current_user && <span className="text-xs text-blue-600 ml-1">(You)</span>}
                                    </p>
                                    {getStatusBadge(admin.status)}
                                  </div>
                                  <p className="text-xs text-gray-600">{admin.email}</p>
                                  <p className="text-xs text-gray-500">
                                    Session: {admin.session_duration}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  admin.is_superuser
                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}>
                                  {admin.role}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <p className="text-sm">No admin users currently logged in</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Button
              onClick={handleGoBack}
              className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-lg font-semibold"
            >
              Go Back
            </Button>

            <Button
              onClick={handleGoHome}
              className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold"
            >
              Go to Dashboard
            </Button>

            {user && (
              <Button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-semibold"
              >
                Logout & Login as Different User
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              If you believe you should have access to this resource, please contact your administrator.
            </p>
            {user?.email && (
              <p className="text-xs text-gray-400 mt-1">
                Contact support with your email: {user.email}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;