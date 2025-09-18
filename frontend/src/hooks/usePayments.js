import { useState, useCallback } from 'react';
import { useApi, useApiMutation } from './useApi';
import { paymentService } from '../services/paymentService';

/**
 * Hook for managing payments due with filtering and search
 */
export const usePaymentsDue = (initialParams = {}) => {
  const [params, setParams] = useState({
    page: 1,
    limit: 20,
    ...initialParams
  });

  const {
    data,
    loading,
    error,
    refetch
  } = useApi(
    () => paymentService.getPaymentsDue(params),
    [params]
  );

  const updateParams = useCallback((newParams) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const refreshPayments = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    payments: data?.results || data || [],
    loading,
    error,
    params,
    updateParams,
    refreshPayments,
    totalCount: data?.count || 0,
    totalPages: data?.count ? Math.ceil(data.count / params.limit) : 1,
    stats: data?.stats || {}
  };
};

/**
 * Hook for admin payment confirmation processing
 */
export const usePaymentProcessor = () => {
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [transactionId, setTransactionId] = useState(null);

  const processManualPayment = useApiMutation(
    paymentService.recordManualPayment,
    {
      onSuccess: (result) => {
        setPaymentStatus('completed');
        setTransactionId(result.payment_id);
      },
      onError: () => {
        setPaymentStatus('failed');
      }
    }
  );

  // Admin-specific payment confirmation for external payments
  const confirmExternalPayment = useApiMutation(
    paymentService.recordManualPayment,
    {
      onSuccess: (result) => {
        setPaymentStatus('completed');
        setTransactionId(result.payment_id);
      },
      onError: () => {
        setPaymentStatus('failed');
      }
    }
  );

  const resetPaymentStatus = useCallback(() => {
    setPaymentStatus(null);
    setTransactionId(null);
  }, []);

  return {
    processManualPayment,
    confirmExternalPayment,
    paymentStatus,
    transactionId,
    resetPaymentStatus,
    isProcessing: processManualPayment.loading || confirmExternalPayment.loading
  };
};

/**
 * Hook for payment reminders
 */
export const usePaymentReminders = () => {
  const sendReminder = useApiMutation(paymentService.sendPaymentReminder);
  const sendBulkReminders = useApiMutation(paymentService.sendBulkPaymentReminders);
  
  return {
    sendReminder,
    sendBulkReminders,
    isLoading: sendReminder.loading || sendBulkReminders.loading,
    error: sendReminder.error || sendBulkReminders.error
  };
};

/**
 * Hook for payment history with filtering
 */
export const usePaymentHistory = (memberId = null, initialParams = {}) => {
  const [params, setParams] = useState({
    page: 1,
    limit: 50,
    ...initialParams
  });

  const apiFunction = memberId 
    ? () => paymentService.getPaymentHistory(memberId, params)
    : () => paymentService.getAllPaymentHistory(params);

  const {
    data,
    loading,
    error,
    refetch
  } = useApi(apiFunction, [params, memberId]);

  const updateParams = useCallback((newParams) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  return {
    payments: data?.results || data || [],
    loading,
    error,
    params,
    updateParams,
    refetch,
    totalCount: data?.count || 0,
    totalPages: data?.count ? Math.ceil(data.count / params.limit) : 1
  };
};

/**
 * Hook for payment statistics
 */
export const usePaymentStats = (timeframe = 'month') => {
  const {
    data: stats,
    loading,
    error,
    refetch
  } = useApi(
    () => paymentService.getPaymentStats({ timeframe }),
    [timeframe]
  );

  return {
    stats: stats || {
      totalRevenue: 0,
      totalPayments: 0,
      overduePayments: 0,
      pendingPayments: 0
    },
    loading,
    error,
    refetch
  };
};

/**
 * Hook for payment form validation and processing
 */
export const usePaymentForm = (member, onSuccess) => {
  const [formData, setFormData] = useState({
    amount: member?.amount || 1500,
    phoneNumber: member?.phone || '',
    paymentMethod: 'mpesa',
    transactionReference: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentTime: new Date().toTimeString().split(' ')[0].slice(0, 5),
    description: `Membership payment for ${member?.first_name || ''} ${member?.last_name || ''}`,
    membershipType: member?.membership_type || 'indoor',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  const { processManualPayment, confirmExternalPayment, paymentStatus, isProcessing, resetPaymentStatus } = usePaymentProcessor();

  const validateForm = useCallback(() => {
    const validation = paymentService.validatePaymentData({
      ...formData,
      memberId: member?.id
    });

    setErrors(validation.errors);
    return validation.isValid;
  }, [formData, member]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  const handlePaymentSubmission = useCallback(async () => {
    if (!validateForm()) return;

    try {
      // Map frontend payment methods to backend expected values
      const paymentMethodMap = {
        'mpesa': 'mpesa',
        'bank': 'bank_transfer',
        'cash': 'cash'
      };

      const paymentData = {
        memberId: member.id,
        amount: formData.amount,
        paymentMethod: paymentMethodMap[formData.paymentMethod] || 'cash',
        description: formData.description
      };

      // Add transaction reference and datetime for external payments (mpesa, bank)
      if (formData.paymentMethod === 'mpesa' || formData.paymentMethod === 'bank') {
        paymentData.transactionReference = formData.transactionReference;
        paymentData.paymentDateTime = `${formData.paymentDate}T${formData.paymentTime}:00`;
        paymentData.notes = formData.notes;
        paymentData.membershipType = formData.membershipType;
      }

      const result = await processManualPayment.mutate(paymentData);

      if (onSuccess) onSuccess(result);
    } catch (error) {
      console.error('Payment submission failed:', error);
    }
  }, [formData, member, validateForm, processManualPayment, onSuccess]);

  return {
    formData,
    errors,
    paymentStatus,
    isProcessing,
    handleInputChange,
    handlePaymentSubmission,
    resetPaymentStatus,
    validateForm
  };
};