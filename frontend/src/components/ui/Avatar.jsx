import React from 'react';

const Avatar = ({ firstName = '', lastName = '', email = '', memberId = '', size = 'md', className = '' }) => {
  const getInitials = () => {
    // If memberId is provided, extract initials from it
    if (memberId) {
      // Convert memberId to string and extract letters
      const memberIdStr = String(memberId);
      const letters = memberIdStr.replace(/[^A-Za-z]/g, '');
      if (letters.length >= 2) {
        return letters.substring(0, 2).toUpperCase();
      } else if (letters.length === 1) {
        return letters.toUpperCase();
      }
    }
    
    // Fallback to name initials
    if (firstName || lastName) {
      const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
      const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
      return firstInitial + lastInitial;
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  };

  const getBackgroundColor = (initials) => {
    const colors = [
      'bg-gradient-to-br from-blue-500 to-blue-600',
      'bg-gradient-to-br from-emerald-500 to-emerald-600',
      'bg-gradient-to-br from-purple-500 to-purple-600',
      'bg-gradient-to-br from-pink-500 to-pink-600',
      'bg-gradient-to-br from-orange-500 to-orange-600',
      'bg-gradient-to-br from-teal-500 to-teal-600',
      'bg-gradient-to-br from-indigo-500 to-indigo-600',
      'bg-gradient-to-br from-red-500 to-red-600',
      'bg-gradient-to-br from-yellow-500 to-yellow-600',
      'bg-gradient-to-br from-green-500 to-green-600'
    ];
    
    let hash = 0;
    for (let i = 0; i < initials.length; i++) {
      hash = initials.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const initials = getInitials();
  const backgroundClass = getBackgroundColor(initials);
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div 
      className={`${sizeClass} ${backgroundClass} rounded-full flex items-center justify-center text-white font-medium shadow-sm ${className}`}
    >
      {initials}
    </div>
  );
};

export default Avatar;