/**
 * @file LandingPage - CRITICAL FIX: Use useAuth hook instead of authService directly
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../../components/ui/Button';
import ForgotPasswordForm from '../../components/forms/ForgotPasswordForm';
import authService from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext'; // ✅ CRITICAL FIX: Import useAuthContext

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ CRITICAL FIX: Use the auth context instead of calling authService directly
  const { login: contextLogin, register: contextRegister } = useAuthContext();
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get the return URL from query params or location state (set by ProtectedRoute)
  const searchParams = new URLSearchParams(location.search);
  const returnUrl = searchParams.get('from') || location.state?.from || '/dashboard';

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        const isValid = await authService.validateSession();
        if (isValid) {
          navigate(returnUrl, { replace: true });
        }
      }
    };
    checkAuth();
  }, [navigate, returnUrl]);

  const slides = [
    {
      title: "Welcome to Paradise",
      subtitle: "Paul's Tropical Fitness",
      description: "Where fitness meets the beauty of tropical paradise. Transform your body in our state-of-the-art facilities.",
      image: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    },
    {
      title: "Indoor Excellence",
      subtitle: "Premium Equipment",
      description: "Experience world-class indoor training with cutting-edge equipment and personalized coaching.",
      image: "https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    },
    {
      title: "Outdoor Adventures",
      subtitle: "Nature's Gym",
      description: "Train under the tropical sun with our outdoor fitness programs designed for all levels.",
      image: "https://images.pexels.com/photos/416809/pexels-photo-416809.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateForm = () => {
    const { email, password, confirmPassword, firstName, lastName, phone } = formData;

    if (!email || !password) {
      setError('📧 Email and password are required.');
      return false;
    }

    if (!email.includes('@') || email.length < 5) {
      setError('📧 Please enter a valid email address.');
      return false;
    }

    if (password.length < 6) {
      setError('🔒 Password must be at least 6 characters long.');
      return false;
    }

    if (authMode === 'signup') {
      if (!firstName || !lastName) {
        setError('👤 First name and last name are required.');
        return false;
      }

      if (firstName.length < 2 || lastName.length < 2) {
        setError('👤 Names must be at least 2 characters long.');
        return false;
      }

      if (password !== confirmPassword) {
        setError('🔒 Passwords do not match.');
        return false;
      }

      if (phone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(phone)) {
        setError('📱 Please enter a valid phone number (at least 10 digits).');
        return false;
      }
    }

    return true;
  };

  // ✅ CRITICAL FIX: Use context functions instead of authService directly
  const handleAuth = async (e) => {
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
      if (authMode === 'login') {
        // ✅ CRITICAL FIX: Use contextLogin instead of authService.login
        const userData = await contextLogin({
          email: formData.email,
          password: formData.password
        });
        
        if (userData) {
          setSuccess(`Welcome back, ${userData.firstName}! 🎉`);
          // Navigation will be handled by useAuth hook
        }
      } else {
        // ✅ CRITICAL FIX: Use contextRegister instead of authService.register
        const registrationData = {
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          username: `${formData.firstName.toLowerCase()}${formData.lastName.toLowerCase()}${Date.now()}`,
          phone_number: formData.phone || '',
          password: formData.password,
          confirm_password: formData.confirmPassword
        };
        
        const result = await contextRegister(registrationData);
        
        if (result.success) {
          if (result.autoLogin && result.userData) {
            setSuccess(`Welcome to Paradise, ${result.userData.firstName}! 🏝️ Logging you in...`);
            // Navigation will be handled by useAuth hook
          } else {
            setSuccess('🎉 Account created successfully! Please sign in to continue.');
            // Switch to login mode and pre-fill email
            setTimeout(() => {
              setAuthMode('login');
              setFormData(prev => ({
                ...prev,
                password: '',
                confirmPassword: '',
                firstName: '',
                lastName: '',
                phone: ''
              }));
            }, 2000);
          }
        }
      }
    } catch (err) {
      // Use the error message from the auth functions
      setError(err.message || 'Something went wrong. Please try again.');
      
      // Clear sensitive fields on error
      if (authMode === 'login') {
        setFormData(prev => ({ ...prev, password: '' }));
      } else {
        setFormData(prev => ({ 
          ...prev, 
          password: '', 
          confirmPassword: '' 
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const switchAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
    setError('');
    setSuccess('');
    // Keep email when switching modes, clear other fields
    setFormData(prev => ({
      email: prev.email, // Keep email
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: ''
    }));
  };

  const handleBackToHome = () => {
    setShowAuth(false);
    setError('');
    setSuccess('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: ''
    });
  };

  const getButtonText = () => {
    if (loading) {
      return authMode === 'login' ? 'Signing In...' : 'Creating Account...';
    }
    return authMode === 'login' ? 'Sign In' : 'Create Account';
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
      {getButtonText()}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 relative overflow-hidden flex flex-col">
      {/* Background Slides */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-30' : 'opacity-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 via-teal-800/80 to-cyan-900/80"></div>
          </div>
        ))}
      </div>

      {/* Tropical Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-4 lg:top-10 lg:left-10 w-16 h-16 lg:w-32 lg:h-32 rounded-full bg-yellow-400 blur-xl"></div>
        <div className="absolute top-16 right-8 lg:top-32 lg:right-20 w-12 h-12 lg:w-24 lg:h-24 rounded-full bg-pink-400 blur-lg"></div>
        <div className="absolute bottom-8 left-16 lg:bottom-20 lg:left-32 w-20 h-20 lg:w-40 lg:h-40 rounded-full bg-orange-400 blur-2xl"></div>
        <div className="absolute bottom-16 right-4 lg:bottom-32 lg:right-10 w-14 h-14 lg:w-28 lg:h-28 rounded-full bg-purple-400 blur-lg"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex">
        {showAuth ? (
          /* Auth Form - Takes full screen when shown */
          <div className="w-full flex items-center justify-center p-4">
            <div className="max-w-md w-full">
              {authMode === 'forgotPassword' ? (
                <ForgotPasswordForm
                  onBack={() => setAuthMode('login')}
                  onSuccess={(email) => {
                    setSuccess(`Password reset instructions sent to ${email}`);
                    setTimeout(() => setAuthMode('login'), 3000);
                  }}
                />
              ) : (
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
                {/* Back Button */}
                <button
                  onClick={handleBackToHome}
                  className="mb-6 text-emerald-300 hover:text-emerald-200 transition-colors flex items-center"
                  disabled={loading}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Home
                </button>

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {authMode === 'login' ? 'Welcome Back' : 'Join Paradise'}
                  </h3>
                  <p className="text-emerald-200 text-sm">
                    {authMode === 'login' 
                      ? 'Sign in to continue' 
                      : 'Create your account'
                    }
                  </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
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

                  {authMode === 'signup' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          name="firstName"
                          placeholder="First Name"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-emerald-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm"
                          required
                          disabled={loading}
                        />
                        <input
                          type="text"
                          name="lastName"
                          placeholder="Last Name"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-emerald-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm"
                          required
                          disabled={loading}
                        />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number (Optional)"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-emerald-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm"
                        disabled={loading}
                      />
                    </>
                  )}

                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-emerald-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm"
                    required
                    disabled={loading}
                  />

                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-emerald-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm"
                    required
                    disabled={loading}
                  />

                  {authMode === 'signup' && (
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-emerald-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm"
                      required
                      disabled={loading}
                    />
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-2.5 rounded-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  >
                    {loading ? <LoadingSpinner /> : getButtonText()}
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    onClick={switchAuthMode}
                    className="text-emerald-300 hover:text-emerald-200 transition-colors disabled:opacity-50 text-sm"
                    disabled={loading}
                  >
                    {authMode === 'login' 
                      ? "Don't have an account? Sign up" 
                      : "Already have an account? Sign in"
                    }
                  </button>
                </div>

                {authMode === 'login' && (
                  <div className="mt-2 text-center">
                    <button
                      onClick={() => setAuthMode('forgotPassword')}
                      className="text-emerald-300 hover:text-emerald-200 transition-colors disabled:opacity-50 text-sm underline"
                      disabled={loading}
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}

                <div className="mt-3 text-center">
                  <p className="text-emerald-200/70 text-xs">
                    By {authMode === 'signup' ? 'creating an account' : 'signing in'}, you agree to our Terms of Service
                  </p>
                </div>
              </div>
              )}
            </div>
          </div>
        ) : (
          /* Hero Content - Show when auth is not visible */
          <div className="w-full flex items-center justify-center p-4 sm:p-6">
            <div className="max-w-2xl text-center text-white w-full">
              {/* Logo */}
              <div className="mb-6 lg:mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full mb-3 lg:mb-4 shadow-2xl">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">🏝️</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-7xl font-bold bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent mb-2">
                  Paul's
                </h1>
                <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-light text-emerald-200">
                  Tropical Fitness
                </h2>
              </div>

              {/* Show return URL message if redirected from protected route */}
              {(searchParams.get('from') || location.state?.from) && (
                <div className="mb-4 lg:mb-6 p-3 lg:p-4 bg-emerald-600/30 backdrop-blur-sm rounded-lg border border-emerald-500/30 mx-4 sm:mx-0">
                  <p className="text-emerald-100 text-xs sm:text-sm">
                    Please sign in to continue to your destination
                  </p>
                </div>
              )}

              {/* Slide Content */}
              <div className="mb-8 lg:mb-12 px-4 sm:px-0">
                <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold mb-3 lg:mb-4 text-emerald-100">
                  {slides[currentSlide].title}
                </h3>
                <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-emerald-200 mb-4 lg:mb-6 leading-relaxed">
                  {slides[currentSlide].description}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center px-4 sm:px-0">
                <Button
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuth(true);
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 lg:px-8 lg:py-4 text-base lg:text-lg font-semibold rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  Start Your Journey 🌴
                </Button>
                <Button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuth(true);
                  }}
                  variant="outline"
                  className="border-2 border-emerald-300 text-emerald-300 hover:bg-emerald-300 hover:text-emerald-900 px-6 py-3 lg:px-8 lg:py-4 text-base lg:text-lg font-semibold rounded-full transition-all duration-300"
                >
                  Member Login
                </Button>
              </div>

              {/* Slide Indicators */}
              <div className="flex justify-center mt-8 lg:mt-12 space-x-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'bg-emerald-400 w-6 lg:w-8' 
                        : 'bg-emerald-600 hover:bg-emerald-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Elements */}
      <div className={`absolute bottom-4 left-4 lg:bottom-8 lg:left-8 text-emerald-300 text-xs lg:text-sm opacity-70 ${showAuth ? 'hidden lg:block' : ''}`}>
        © 2025 Tropical Fitness. All rights reserved.
      </div>
    </div>
  );
};

export default LandingPage;
