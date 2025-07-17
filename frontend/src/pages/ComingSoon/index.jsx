import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';

const ComingSoon = () => {
  const navigate = useNavigate();
  const [currentEmoji, setCurrentEmoji] = useState(0);
  const [motivationalQuote, setMotivationalQuote] = useState(0);

  const gymEmojis = ['💪', '🏋️‍♂️', '🏋️‍♀️', '🤸‍♂️', '🤸‍♀️', '🏃‍♂️', '🏃‍♀️', '🧘‍♂️', '🧘‍♀️', '🚴‍♂️', '🚴‍♀️'];
  
  const motivationalQuotes = [
    "Your only limit is you! 💯",
    "Sweat is just fat crying! 😅",
    "No pain, no gain! 🔥",
    "Strong is the new skinny! 💪",
    "Fitness is not about being better than someone else... it's about being better than you used to be! ✨",
    "The only bad workout is the one that didn't happen! 🏃‍♂️",
    "Push yourself because no one else is going to do it for you! 🚀",
    "Great things never come from comfort zones! 🌟",
    "Don't wish for it, work for it! 💼",
    "Success starts with self-discipline! 🎯"
  ];

  useEffect(() => {
    const emojiInterval = setInterval(() => {
      setCurrentEmoji((prev) => (prev + 1) % gymEmojis.length);
    }, 1000);

    const quoteInterval = setInterval(() => {
      setMotivationalQuote((prev) => (prev + 1) % motivationalQuotes.length);
    }, 4000);

    return () => {
      clearInterval(emojiInterval);
      clearInterval(quoteInterval);
    };
  }, []);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleReportIssue = () => {
    window.open('mailto:support@paulstropicalfitness.com?subject=Page%20Issue%20Report', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-6">
      <div className="max-w-2xl mx-auto text-center">
        {/* Animated Emoji */}
        <div className="text-8xl mb-8 animate-bounce">
          {gymEmojis[currentEmoji]}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Coming Soon!
          </h1>
          
          <div className="text-xl md:text-2xl text-gray-600 mb-8">
            We're pumping iron on this feature! 🏗️
          </div>

          {/* Motivational Quote */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-500 mb-8">
            <p className="text-lg font-medium text-gray-800 italic">
              "{motivationalQuotes[motivationalQuote]}"
            </p>
          </div>

          {/* Feature Preview */}
          <div className="bg-gray-50 rounded-2xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">What's Coming? 🚀</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📊</span>
                <span className="text-gray-700">Advanced Analytics</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📱</span>
                <span className="text-gray-700">Mobile App Integration</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🎯</span>
                <span className="text-gray-700">Goal Tracking</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🏆</span>
                <span className="text-gray-700">Achievement System</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">💬</span>
                <span className="text-gray-700">Member Chat</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📅</span>
                <span className="text-gray-700">Smart Scheduling</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-200 rounded-full h-4 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full animate-pulse" style={{ width: '75%' }}></div>
          </div>
          <p className="text-sm text-gray-600 mb-8">Development Progress: 75% Complete</p>

          {/* Fun Gym Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">💪</div>
              <div className="text-lg font-semibold text-gray-900">1,247</div>
              <div className="text-sm text-gray-600">Reps Coded</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600">☕</div>
              <div className="text-lg font-semibold text-gray-900">42</div>
              <div className="text-sm text-gray-600">Cups of Coffee</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-purple-600">🔥</div>
              <div className="text-lg font-semibold text-gray-900">∞</div>
              <div className="text-sm text-gray-600">Lines of Passion</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="primary"
              onClick={handleGoHome}
              className="px-8 py-3 text-lg"
            >
              🏠 Back to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={handleReportIssue}
              className="px-8 py-3 text-lg"
            >
              🐛 Report Issue
            </Button>
          </div>

          {/* Footer Message */}
          <div className="mt-12 text-sm text-gray-500">
            <p>💡 Tip: While you wait, why not check out our other amazing features?</p>
            <p className="mt-2">Built with ❤️ by the Paul's Tropical Fitness Team</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;