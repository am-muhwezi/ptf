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

// Payment-specific validation
export const isValidMpesaPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return /^(254|0)[17]\d{8}$/.test(cleaned);
};

export const paymentValidationSchema = {
  amount: [validationRules.required, validationRules.validAmount],
  phoneNumber: [
    validationRules.required,
    {
      validator: isValidMpesaPhone,
      message: 'Please enter a valid M-Pesa phone number (07XX or 01XX format)'
    }
  ],
  memberId: [validationRules.required]
};

export const paymentReminderValidationSchema = {
  method: [validationRules.required],
  message: [validationRules.required, validationRules.minLength(10), validationRules.maxLength(160)],
  urgency: [validationRules.required]
};