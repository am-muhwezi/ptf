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
 * Hook for payment processing with status tracking
 */
export const usePaymentProcessor = () => {
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [transactionId, setTransactionId] = useState(null);

  const processMpesaPayment = useApiMutation(
    paymentService.initiateMpesaPayment,
    {
      onSuccess: (result) => {
        setTransactionId(result.transactionId);
        setPaymentStatus('pending');
        
        // Start polling for payment status
        const pollInterval = setInterval(async () => {
          try {
            const status = await paymentService.checkPaymentStatus(result.transactionId);
            setPaymentStatus(status.status);
            
            if (status.status === 'completed' || status.status === 'failed') {
              clearInterval(pollInterval);
            }
          } catch (error) {
            console.error('Error checking payment status:', error);
            clearInterval(pollInterval);
            setPaymentStatus('failed');
          }
        }, 3000);
      },
      onError: () => {
        setPaymentStatus('failed');
      }
    }
  );

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

  const resetPaymentStatus = useCallback(() => {
    setPaymentStatus(null);
    setTransactionId(null);
  }, []);

  return {
    processMpesaPayment,
    processManualPayment,
    paymentStatus,
    transactionId,
    resetPaymentStatus,
    isProcessing: processMpesaPayment.loading || processManualPayment.loading
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
    paymentMethod: 'cash',
    description: `Membership payment for ${member?.first_name || ''} ${member?.last_name || ''}`,
    membershipType: member?.membership_type || 'indoor'
  });

  const [errors, setErrors] = useState({});

  const { processMpesaPayment, processManualPayment, paymentStatus, isProcessing, resetPaymentStatus } = usePaymentProcessor();

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

  const handleMpesaPayment = useCallback(async () => {
    if (!validateForm()) return;

    const formattedPhone = paymentService.formatPhoneNumber(formData.phoneNumber);
    
    try {
      const result = await processMpesaPayment.mutate({
        memberId: member.id,
        amount: formData.amount,
        phoneNumber: formattedPhone,
        description: formData.description,
        membershipType: formData.membershipType
      });
      
      if (onSuccess) onSuccess(result);
    } catch (error) {
      console.error('M-Pesa payment failed:', error);
    }
  }, [formData, member, validateForm, processMpesaPayment, onSuccess]);

  const handleManualPayment = useCallback(async () => {
    if (!validateForm()) return;

    try {
      const result = await processManualPayment.mutate({
        memberId: member.id,
        amount: formData.amount,
        paymentMethod: formData.paymentMethod,
        description: formData.description
      });
      
      if (onSuccess) onSuccess(result);
    } catch (error) {
      console.error('Manual payment failed:', error);
    }
  }, [formData, member, validateForm, processManualPayment, onSuccess]);

  return {
    formData,
    errors,
    paymentStatus,
    isProcessing,
    handleInputChange,
    handleMpesaPayment,
    handleManualPayment,
    resetPaymentStatus,
    validateForm
  };
};