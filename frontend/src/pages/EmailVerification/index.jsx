import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../../services/authApi';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error', 'resend'
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      setStatus('verifying');
      const result = await authApi.verifyEmail(token);

      setStatus('success');
      setMessage(result.message || 'Email verified successfully! Your admin account is now active.');

      // Redirect to landing page after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (error) {
      setStatus('error');
      const errorMsg = error.response?.data?.details?.token?.[0] ||
                      error.response?.data?.error ||
                      'Failed to verify email. The link may be invalid or expired.';
      setMessage(errorMsg);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      alert('Please enter your email address');
      return;
    }

    try {
      setIsResending(true);
      await authApi.resendVerification(email);
      setStatus('resend');
      setMessage('A new verification link has been sent to your email address.');
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to resend verification email';
      setMessage(errorMsg);
    } finally {
      setIsResending(false);
    }
  };

  const renderVerifyingState = () => (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-6 animate-pulse">
        <span className="text-2xl">⏳</span>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Verifying Email...</h1>
      <p className="text-gray-600">Please wait while we verify your email address.</p>
    </div>
  );

  const renderSuccessState = () => (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-6">
        <span className="text-2xl">✅</span>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Email Verified!</h1>
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <p className="text-green-800 text-sm">
          🎉 Your admin account is now active! You'll be redirected to the login page in a few seconds.
        </p>
      </div>
      <button
        onClick={() => navigate('/')}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
      >
        Go to Login
      </button>
    </div>
  );

  const renderErrorState = () => (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 rounded-full mb-6">
        <span className="text-2xl">❌</span>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Verification Failed</h1>
      <p className="text-gray-600 mb-6">{message}</p>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p className="text-red-800 text-sm mb-4">
          Your verification link may be invalid or expired. You can request a new verification email below.
        </p>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={handleResendVerification}
            disabled={isResending}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {isResending ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </div>
      </div>

      <button
        onClick={() => navigate('/')}
        className="text-emerald-600 hover:text-emerald-700 underline"
      >
        Back to Login
      </button>
    </div>
  );

  const renderResendState = () => (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-6">
        <span className="text-2xl">📧</span>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Email Sent!</h1>
      <p className="text-gray-600 mb-6">{message}</p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800 text-sm">
          Please check your email inbox and click the verification link to activate your admin account.
        </p>
      </div>

      <button
        onClick={() => navigate('/')}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
      >
        Back to Login
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full mb-4">
            <span className="text-white text-xl font-bold">🏝️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Paul's Tropical Fitness</h2>
          <p className="text-gray-500 text-sm">Admin Email Verification</p>
        </div>

        {/* Content based on status */}
        {status === 'verifying' && renderVerifyingState()}
        {status === 'success' && renderSuccessState()}
        {status === 'error' && renderErrorState()}
        {status === 'resend' && renderResendState()}
      </div>
    </div>
  );
};

export default EmailVerification;