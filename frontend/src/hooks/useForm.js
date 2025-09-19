import { useState, useCallback } from 'react';

/**
 * Custom hook for form state management and validation
 * @param {Object} initialValues - Initial form values
 * @param {Function} validationSchema - Validation function that returns errors object
 * @param {Function} onSubmit - Submit handler function
 */
export const useForm = (initialValues = {}, validationSchema = null, onSubmit = null) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setValues(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear field error when user starts typing (for better UX)
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError('');
    }
  }, [errors, submitError]);

  // Handle blur validation for individual fields
  const handleBlur = useCallback((e) => {
    const { name } = e.target;

    if (validationSchema && values[name] !== undefined) {
      // Run validation only for this field
      const allErrors = validationSchema(values);
      const fieldError = allErrors[name];

      if (fieldError) {
        setErrors(prev => ({
          ...prev,
          [name]: fieldError
        }));
      }
    }
  }, [validationSchema, values]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Run validation if provided
    if (validationSchema) {
      const validationErrors = validationSchema(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      if (onSubmit) {
        await onSubmit(values);
      }
    } catch (error) {
      // Handle field-specific errors
      if (error.fieldErrors) {
        setErrors(error.fieldErrors);
      }
      
      // Set general submit error
      setSubmitError(error.message || 'An error occurred while submitting the form');
      
      // Re-throw error for component-level handling if needed
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validationSchema, onSubmit, isSubmitting]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setSubmitError('');
    setIsSubmitting(false);
  }, [initialValues]);

  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  return {
    values,
    errors,
    isSubmitting,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    setErrors,
    setSubmitError
  };
};

/**
 * Common validation schemas
 */
export const validationSchemas = {
  memberRegistration: (values) => {
    const errors = {};

    if (!values.first_name?.trim()) {
      errors.first_name = 'First name is required';
    }

    if (!values.last_name?.trim()) {
      errors.last_name = 'Last name is required';
    }

    if (values.email?.trim() && !/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'Email is invalid';
    }

    if (!values.phone?.trim()) {
      errors.phone = 'Phone number is required';
    }

    if (!values.emergency_contact_name?.trim()) {
      errors.emergency_contact_name = 'Emergency contact is required';
    }

    if (!values.emergency_contact_phone?.trim()) {
      errors.emergency_contact_phone = 'Emergency phone is required';
    }

    if (values.membershipType === 'indoor' && !values.planType) {
      errors.planType = 'Plan type is required for indoor membership';
    }

    if (values.membershipType === 'outdoor' && !values.location) {
      errors.location = 'Location is required for outdoor membership';
    }

    return errors;
  },

  login: (values) => {
    const errors = {};

    if (!values.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'Email is invalid';
    }

    if (!values.password) {
      errors.password = 'Password is required';
    } else if (values.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    return errors;
  },

  registration: (values) => {
    const errors = {};

    if (!values.first_name?.trim()) {
      errors.first_name = 'First name is required';
    }

    if (!values.last_name?.trim()) {
      errors.last_name = 'Last name is required';
    }

    if (!values.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'Email is invalid';
    }

    if (!values.password) {
      errors.password = 'Password is required';
    } else if (values.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (values.password !== values.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (values.phone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(values.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    return errors;
  }
};