/**
 * Validation utilities for form inputs and data validation
 */

// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone number validation (supports various formats)
export const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

// Password strength validation
export const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Required field validation
export const isRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined && value !== '';
};

// Minimum length validation
export const hasMinLength = (value, minLength) => {
  if (typeof value === 'string') {
    return value.trim().length >= minLength;
  }
  return false;
};

// Maximum length validation
export const hasMaxLength = (value, maxLength) => {
  if (typeof value === 'string') {
    return value.trim().length <= maxLength;
  }
  return false;
};

// Date validation
export const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// Age validation (must be at least 18 years old)
export const isValidAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age >= 18;
};

// ID/Passport number validation (basic format check)
export const isValidIdNumber = (idNumber) => {
  // Remove spaces and check if it contains only alphanumeric characters
  const cleanId = idNumber.replace(/\s/g, '');
  return /^[A-Z0-9]{6,15}$/i.test(cleanId);
};

// Amount/currency validation
export const isValidAmount = (amount) => {
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount > 0;
};

// Generic validation function builder
export const createValidator = (rules) => {
  return (value) => {
    const errors = [];
    
    for (const rule of rules) {
      const { validator, message, params = [] } = rule;
      
      if (!validator(value, ...params)) {
        errors.push(message);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
};

// Simple boolean check for Kenyan phone numbers (for backward compatibility)
export const isValidKenyanPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');

  // Handle different Kenyan phone number formats
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    const localPart = cleaned.substring(3);
    return /^[71]\d{8}$/.test(localPart) ||
           /^1(01|1[0-9])\d{6}$/.test(localPart) ||
           /^[1]\d{8}$/.test(localPart) ||
           /^20\d{7}$/.test(localPart) ||
           /^[2-6]\d{7,8}$/.test(localPart);
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    const localPart = cleaned.substring(1);
    return /^[71]\d{8}$/.test(localPart) ||
           /^1(01|1[0-9])\d{6}$/.test(localPart) ||
           /^[1]\d{8}$/.test(localPart) ||
           /^20\d{7}$/.test(localPart) ||
           /^[2-6]\d{7,8}$/.test(localPart);
  } else if (cleaned.length === 9) {
    return /^[71]\d{8}$/.test(cleaned) ||
           /^1(01|1[0-9])\d{6}$/.test(cleaned) ||
           /^[1]\d{8}$/.test(cleaned) ||
           /^20\d{7}$/.test(cleaned);
  }

  return false;
};

// Pre-built validation rules
export const validationRules = {
  required: {
    validator: isRequired,
    message: 'This field is required'
  },
  email: {
    validator: isValidEmail,
    message: 'Please enter a valid email address'
  },
  phone: {
    validator: isValidPhoneNumber,
    message: 'Please enter a valid phone number'
  },
  kenyanPhone: {
    validator: isValidKenyanPhone,
    message: 'Please enter a valid Kenyan phone number (e.g., 0722 123 456, 0101 123 456, 0110 123 456, +254 722 123 456)'
  },
  minLength: (length) => ({
    validator: hasMinLength,
    params: [length],
    message: `Must be at least ${length} characters long`
  }),
  maxLength: (length) => ({
    validator: hasMaxLength,
    params: [length],
    message: `Must be no more than ${length} characters long`
  }),
  validDate: {
    validator: isValidDate,
    message: 'Please enter a valid date'
  },
  validAge: {
    validator: isValidAge,
    message: 'Must be at least 18 years old'
  },
  validId: {
    validator: isValidIdNumber,
    message: 'Please enter a valid ID/Passport number'
  },
  validAmount: {
    validator: isValidAmount,
    message: 'Please enter a valid amount greater than 0'
  }
};

// Form validation helper
export const validateForm = (formData, validationSchema) => {
  const errors = {};
  let hasErrors = false;
  
  for (const [fieldName, rules] of Object.entries(validationSchema)) {
    const validator = createValidator(rules);
    const result = validator(formData[fieldName]);
    
    if (!result.isValid) {
      errors[fieldName] = result.errors[0]; // Take first error
      hasErrors = true;
    }
  }
  
  return {
    isValid: !hasErrors,
    errors
  };
};

// Common validation schemas
export const memberValidationSchema = {
  first_name: [validationRules.required, validationRules.minLength(2)],
  last_name: [validationRules.required, validationRules.minLength(2)],
  email: [validationRules.email],
  phone: [validationRules.required, validationRules.phone],
  emergency_contact_name: [validationRules.required, validationRules.minLength(2)],
  emergency_contact_phone: [validationRules.required, validationRules.phone]
};

export const loginValidationSchema = {
  email: [validationRules.required, validationRules.email],
  password: [validationRules.required, validationRules.minLength(6)]
};

export const registrationValidationSchema = {
  first_name: [validationRules.required, validationRules.minLength(2)],
  last_name: [validationRules.required, validationRules.minLength(2)],
  email: [validationRules.required, validationRules.email],
  password: [validationRules.required, validationRules.minLength(6)],
  phone: [validationRules.phone]
};

// Kenyan phone number validation with normalization
export const validateKenyanPhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      message: 'Phone number is required',
      normalizedPhone: ''
    };
  }

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Check for empty after cleaning
  if (!cleaned) {
    return {
      isValid: false,
      message: 'Phone number is required',
      normalizedPhone: ''
    };
  }

  let normalizedPhone = '';
  let isValid = false;

  // Handle different Kenyan phone number formats
  if (cleaned.startsWith('254')) {
    // International format: +254XXXXXXXXX (should be 12 digits total)
    if (cleaned.length === 12) {
      const localPart = cleaned.substring(3); // Remove '254'

      // Check if it's a valid Kenyan mobile number
      if (/^[71]\d{8}$/.test(localPart)) {
        // Mobile: 7XX XXX XXX (Safaricom, Airtel, Telkom)
        normalizedPhone = `+254 ${localPart.substring(0, 3)} ${localPart.substring(3, 6)} ${localPart.substring(6)}`;
        isValid = true;
      } else if (/^1(01|1[0-9])\d{6}$/.test(localPart)) {
        // Newer mobile providers: 101 XXX XXX (Faiba), 11X XXX XXX (Equitel, etc.)
        normalizedPhone = `+254 ${localPart.substring(0, 3)} ${localPart.substring(3, 6)} ${localPart.substring(6)}`;
        isValid = true;
      } else if (/^[1]\d{8}$/.test(localPart)) {
        // Other mobile providers: 1XX XXX XXX
        normalizedPhone = `+254 ${localPart.substring(0, 3)} ${localPart.substring(3, 6)} ${localPart.substring(6)}`;
        isValid = true;
      } else if (/^20\d{7}$/.test(localPart)) {
        // Nairobi landline: 20 XXX XXXX
        normalizedPhone = `+254 20 ${localPart.substring(2, 5)} ${localPart.substring(5)}`;
        isValid = true;
      } else if (/^[2-6]\d{7,8}$/.test(localPart)) {
        // Other area codes: XX XXX XXXX or XXX XXX XXX
        if (localPart.length === 8) {
          normalizedPhone = `+254 ${localPart.substring(0, 2)} ${localPart.substring(2, 5)} ${localPart.substring(5)}`;
        } else {
          normalizedPhone = `+254 ${localPart.substring(0, 3)} ${localPart.substring(3, 6)} ${localPart.substring(6)}`;
        }
        isValid = true;
      }
    }
  } else if (cleaned.startsWith('0')) {
    // Local format: 0XXXXXXXXX
    if (cleaned.length === 10) {
      const localPart = cleaned.substring(1); // Remove leading '0'

      if (/^[71]\d{8}$/.test(localPart)) {
        // Mobile: 07XX XXX XXX
        normalizedPhone = `+254 ${localPart.substring(0, 3)} ${localPart.substring(3, 6)} ${localPart.substring(6)}`;
        isValid = true;
      } else if (/^1(01|1[0-9])\d{6}$/.test(localPart)) {
        // Newer mobile providers: 0101 XXX XXX (Faiba), 011X XXX XXX (Equitel, etc.)
        normalizedPhone = `+254 ${localPart.substring(0, 3)} ${localPart.substring(3, 6)} ${localPart.substring(6)}`;
        isValid = true;
      } else if (/^[1]\d{8}$/.test(localPart)) {
        // Other mobile providers: 01XX XXX XXX
        normalizedPhone = `+254 ${localPart.substring(0, 3)} ${localPart.substring(3, 6)} ${localPart.substring(6)}`;
        isValid = true;
      }
    } else if (cleaned.length === 10 && cleaned.startsWith('020')) {
      // Nairobi landline: 020 XXX XXXX (10 digits total)
      const localPart = cleaned.substring(1); // Remove leading '0'
      normalizedPhone = `+254 20 ${localPart.substring(2, 5)} ${localPart.substring(5)}`;
      isValid = true;
    } else if (cleaned.length >= 8 && cleaned.length <= 10) {
      // Other area codes: 0XX XXX XXXX
      const localPart = cleaned.substring(1); // Remove leading '0'
      if (/^[2-6]\d{6,8}$/.test(localPart)) {
        if (localPart.length === 8) {
          normalizedPhone = `+254 ${localPart.substring(0, 2)} ${localPart.substring(2, 5)} ${localPart.substring(5)}`;
        } else {
          normalizedPhone = `+254 ${localPart.substring(0, 3)} ${localPart.substring(3, 6)} ${localPart.substring(6)}`;
        }
        isValid = true;
      }
    }
  } else if (cleaned.length === 9) {
    // Direct local format without leading 0: XXXXXXXXX
    if (/^[71]\d{8}$/.test(cleaned)) {
      // Mobile: 7XX XXX XXX
      normalizedPhone = `+254 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
      isValid = true;
    } else if (/^1(01|1[0-9])\d{6}$/.test(cleaned)) {
      // Newer mobile providers: 101 XXX XXX (Faiba), 11X XXX XXX (Equitel, etc.)
      normalizedPhone = `+254 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
      isValid = true;
    } else if (/^[1]\d{8}$/.test(cleaned)) {
      // Other mobile providers: 1XX XXX XXX
      normalizedPhone = `+254 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
      isValid = true;
    } else if (/^20\d{7}$/.test(cleaned)) {
      // Nairobi landline: 20 XXX XXXX
      normalizedPhone = `+254 20 ${cleaned.substring(2, 5)} ${cleaned.substring(5)}`;
      isValid = true;
    }
  }

  if (!isValid) {
    return {
      isValid: false,
      message: 'Please enter a valid Kenyan phone number (e.g., 0722 123 456, 0101 123 456, 0110 123 456, +254 722 123 456)',
      normalizedPhone: ''
    };
  }

  return {
    isValid: true,
    message: '',
    normalizedPhone
  };
};


// Payment-specific validation
export const isValidMpesaPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  // Updated to include newer formats like 0101 (Faiba) and 011X (Equitel, etc.)
  return /^(254|0)[17]\d{8}$/.test(cleaned) || /^(254|0)1(01|1[0-9])\d{6}$/.test(cleaned);
};

export const paymentValidationSchema = {
  amount: [validationRules.required, validationRules.validAmount],
  phoneNumber: [
    validationRules.required,
    {
      validator: isValidMpesaPhone,
      message: 'Please enter a valid M-Pesa phone number (07XX, 01XX, 0101, or 011X format)'
    }
  ],
  memberId: [validationRules.required]
};

export const paymentReminderValidationSchema = {
  method: [validationRules.required],
  message: [validationRules.required, validationRules.minLength(10), validationRules.maxLength(160)],
  urgency: [validationRules.required]
};