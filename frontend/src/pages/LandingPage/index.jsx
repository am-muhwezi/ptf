import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';

const LandingPage = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: ''
  });

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
  };

  const handleAuth = (e) => {
    e.preventDefault();
    // Mock authentication - in real app, this would call your API
    console.log('Auth attempt:', authMode, formData);
    
    // Simulate successful login/signup
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  const switchAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 relative overflow-hidden">
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
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-yellow-400 blur-xl"></div>
        <div className="absolute top-32 right-20 w-24 h-24 rounded-full bg-pink-400 blur-lg"></div>
        <div className="absolute bottom-20 left-32 w-40 h-40 rounded-full bg-orange-400 blur-2xl"></div>
        <div className="absolute bottom-32 right-10 w-28 h-28 rounded-full bg-purple-400 blur-lg"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Hero Content */}
        <div className={`flex-1 flex items-center justify-center p-8 transition-transform duration-700 ${
          showAuth ? '-translate-x-full' : 'translate-x-0'
        }`}>
          <div className="max-w-2xl text-center text-white">
            {/* Logo */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full mb-4 shadow-2xl">
                <span className="text-3xl font-bold text-white">🏝️</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent mb-2">
                Paul's
              </h1>
              <h2 className="text-3xl md:text-4xl font-light text-emerald-200">
                Tropical Fitness
              </h2>
            </div>

            {/* Slide Content */}
            <div className="mb-12">
              <h3 className="text-2xl md:text-3xl font-bold mb-4 text-emerald-100">
                {slides[currentSlide].title}
              </h3>
              <p className="text-lg md:text-xl text-emerald-200 mb-6 leading-relaxed">
                {slides[currentSlide].description}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuth(true);
                }}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                Start Your Journey 🌴
              </Button>
              <Button
                onClick={() => {
                  setAuthMode('login');
                  setShowAuth(true);
                }}
                variant="outline"
                className="border-2 border-emerald-300 text-emerald-300 hover:bg-emerald-300 hover:text-emerald-900 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300"
              >
                Member Login
              </Button>
            </div>

            {/* Slide Indicators */}
            <div className="flex justify-center mt-12 space-x-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-emerald-400 w-8' 
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className={`flex-1 flex items-center justify-center p-8 transition-transform duration-700 ${
          showAuth ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="max-w-md w-full">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
              {/* Back Button */}
              <button
                onClick={() => setShowAuth(false)}
                className="mb-6 text-emerald-300 hover:text-emerald-200 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Home
              </button>

              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-white mb-2">
                  {authMode === 'login' ? 'Welcome Back' : 'Join Paradise'}
                </h3>
                <p className="text-emerald-200">
                  {authMode === 'login' 
                    ? 'Sign in to continue your fitness journey' 
                    : 'Create your account and start transforming'
                  }
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-6">
                {authMode === 'signup' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          name="firstName"
                          placeholder="First Name"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          name="lastName"
                          placeholder="Last Name"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm"
                        required
                      />
                    </div>
                  </>
                )}

                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm"
                    required
                  />
                </div>

                <div>
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm"
                    required
                  />
                </div>

                {authMode === 'signup' && (
                  <div>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm"
                      required
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  {authMode === 'login' ? 'Sign In' : 'Create Account'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={switchAuthMode}
                  className="text-emerald-300 hover:text-emerald-200 transition-colors"
                >
                  {authMode === 'login' 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute bottom-8 left-8 text-emerald-300 text-sm opacity-70">
        © 2024 Paul's Tropical Fitness. All rights reserved.
      </div>
    </div>
  );
};

export default LandingPage;