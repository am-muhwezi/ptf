import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();

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
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
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
                Logged in as: <strong>{user.first_name} {user.last_name}</strong>
                {user.is_staff && <span className="text-blue-600"> (Staff)</span>}
                {user.is_superuser && <span className="text-red-600"> (Superuser)</span>}
              </span>
            )}
          </p>

          {/* User Info */}
          {user && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-800 mb-2">Your Permissions:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${user.is_active ? 'bg-green-400' : 'bg-red-400'}`}></span>
                  Account Status: {user.is_active ? 'Active' : 'Inactive'}
                </li>
                <li className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${user.is_staff ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                  Staff Access: {user.is_staff ? 'Yes' : 'No'}
                </li>
                <li className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${user.is_superuser ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                  Superuser Access: {user.is_superuser ? 'Yes' : 'No'}
                </li>
              </ul>
              
              {/* Debug Info */}
              <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                <h4 className="text-xs font-semibold text-yellow-800 mb-1">Debug Info:</h4>
                <pre className="text-xs text-yellow-700 whitespace-pre-wrap">
                  {JSON.stringify({
                    email: user.email,
                    is_staff: user.is_staff,
                    is_superuser: user.is_superuser,
                    is_active: user.is_active
                  }, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <Button
              onClick={handleGoBack}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold"
            >
              Go Back
            </Button>
            
            <Button
              onClick={handleGoHome}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold"
            >
              Go to Homepage
            </Button>

            {user && (
              <Button
                onClick={handleLogout}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold"
              >
                Logout & Login as Different User
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              If you believe you should have access to this resource, please contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;