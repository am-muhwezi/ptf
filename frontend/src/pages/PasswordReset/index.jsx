import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import authService from '../../services/authService';

const PasswordReset = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenValid, setTokenValid] = useState(null);

  useEffect(() => {
    // Validate token on component mount
    if (!token || !email) {
      setError('❌ Invalid reset link. Please request a new password reset.');
      setTokenValid(false);
      return;
    }

    // TODO: Validate token with backend
    // For now, assume it's valid if present
    setTokenValid(true);
  }, [token, email]);

  const validateForm = () => {
    const { password, confirmPassword } = formData;

    if (!password) {
      setError('🔒 New password is required.');
      return false;
    }

    if (password.length < 8) {
      setError('🔒 Password must be at least 8 characters long.');
      return false;
    }

    if (password !== confirmPassword) {
      setError('🔒 Passwords do not match.');
      return false;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setError('🔒 Password must contain uppercase, lowercase, and numbers.');
      return false;
    }

    return true;
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }

    // Prevent double submission
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const resetData = {
        token: token,
        uid: searchParams.get('uid'),
        password: formData.password,
        confirm_password: formData.confirmPassword
      };
      
      const result = await authService.resetPassword(resetData);
      
      if (result.success) {
        setSuccess('🎉 Password reset successful! Redirecting to login...');
        
        // Redirect to login after success
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      } else {
        throw new Error(result.message || 'Failed to reset password');
      }
      
    } catch (err) {
      setError(err.message || '❌ Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
      Resetting Password...
    </div>
  );

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Invalid Reset Link</h3>
            <p className="text-emerald-200 mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Validating reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 relative overflow-hidden flex items-center justify-center p-4">
      {/* Tropical Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-yellow-400 blur-xl"></div>
        <div className="absolute top-32 right-20 w-24 h-24 rounded-full bg-pink-400 blur-lg"></div>
        <div className="absolute bottom-20 left-32 w-40 h-40 rounded-full bg-orange-400 blur-2xl"></div>
        <div className="absolute bottom-32 right-10 w-28 h-28 rounded-full bg-purple-400 blur-lg"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full mb-4 shadow-2xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2 2 2 0 11-4 0c0-1.1.9-2 2-2zM7 10a2 2 0 012-2m0 0a2 2 0 012 2 2 2 0 11-4 0c0-1.1.9-2 2-2zm1 8a2 2 0 012-2m0 0a2 2 0 012 2 2 2 0 11-4 0c0-1.1.9-2 2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Reset Your Password
            </h3>
            <p className="text-emerald-200 text-sm">
              Create a new password for {email}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Enhanced message display */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg text-center text-sm animate-pulse">
                <div className="flex items-center justify-center mb-1">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Oops!</span>
                </div>
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-500/20 border border-green-500/30 text-green-300 rounded-lg text-center text-sm animate-pulse">
                <div className="flex items-center justify-center mb-1">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Success!</span>
                </div>
                {success}
              </div>
            )}

            <input
              type="password"
              name="password"
              placeholder="New Password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-emerald-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm"
              required
              disabled={loading}
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm New Password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-emerald-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm"
              required
              disabled={loading}
            />

            <div className="text-xs text-emerald-200/70 space-y-1">
              <p>Password requirements:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>At least 8 characters long</li>
                <li>Contains uppercase and lowercase letters</li>
                <li>Contains at least one number</li>
              </ul>
            </div>

            <Button
              type="submit"
              disabled={loading || success}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-2.5 rounded-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
            >
              {loading ? <LoadingSpinner /> : 'Reset Password'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-emerald-300 hover:text-emerald-200 transition-colors text-sm underline"
              disabled={loading}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;