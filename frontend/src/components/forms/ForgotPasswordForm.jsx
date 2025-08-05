import React, { useState } from 'react';
import Button from '../ui/Button';
import authService from '../../services/authService';

const ForgotPasswordForm = ({ onBack, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateEmail = (email) => {
    if (!email) {
      return '📧 Email address is required.';
    }
    if (!email.includes('@') || email.length < 5) {
      return '📧 Please enter a valid email address.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setError('');
    setSuccess('');
    
    // Validate email
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    // Prevent double submission
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const result = await authService.forgotPassword(email);
      
      if (result.success) {
        setSuccess('🎉 Password reset instructions have been sent to your email!');
        
        // Call onSuccess callback after a delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(email);
          }
        }, 2000);
      } else {
        throw new Error(result.message || 'Failed to send reset email');
      }
      
    } catch (err) {
      setError(err.message || '❌ Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
      Sending Reset Email...
    </div>
  );

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-6 text-emerald-300 hover:text-emerald-200 transition-colors flex items-center"
        disabled={loading}
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Login
      </button>

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full mb-4 shadow-2xl">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2 2 2 0 11-4 0c0-1.1.9-2 2-2zM7 10a2 2 0 012-2m0 0a2 2 0 012 2 2 2 0 11-4 0c0-1.1.9-2 2-2zm1 8a2 2 0 012-2m0 0a2 2 0 012 2 2 2 0 11-4 0c0-1.1.9-2 2-2z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          Forgot Password?
        </h3>
        <p className="text-emerald-200 text-sm">
          No worries! Enter your email and we'll send you reset instructions.
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
          type="email"
          name="email"
          placeholder="Enter your email address"
          value={email}
          onChange={handleInputChange}
          className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-emerald-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm"
          required
          disabled={loading}
          autoFocus
        />

        <Button
          type="submit"
          disabled={loading || success}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-2.5 rounded-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
        >
          {loading ? <LoadingSpinner /> : 'Send Reset Instructions'}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-emerald-200/70 text-xs">
          Remember your password?{' '}
          <button
            onClick={onBack}
            className="text-emerald-300 hover:text-emerald-200 transition-colors underline"
            disabled={loading}
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;