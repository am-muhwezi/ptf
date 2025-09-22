// Currency formatter
export const formatCurrency = (amount, currency = 'KES') => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0
  }).format(amount);
};

// Date formatter
export const formatDate = (dateString, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options
  };
  
  return new Date(dateString).toLocaleDateString('en-GB', defaultOptions);
};

// Relative time formatter
export const formatRelativeTime = (dateString) => {
  if (!dateString || dateString === null) {
    return 'Never';
  }

  const date = new Date(dateString);

  // Check if date is invalid
  if (isNaN(date.getTime())) {
    return 'Never';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return formatDate(dateString);
};

// Days until expiry
export const getDaysUntilExpiry = (expiryDate) => {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Check if membership is expiring soon
export const isExpiringSoon = (expiryDate, threshold = 30) => {
  const daysUntilExpiry = getDaysUntilExpiry(expiryDate);
  return daysUntilExpiry <= threshold && daysUntilExpiry > 0;
};

// Format phone number
export const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as +254 XXX XXX XXX (Kenya)
  if (cleaned.length === 12 && cleaned.startsWith('254')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  
  // Format as 0XXX XXX XXX
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone; // Return original if format not recognized
};