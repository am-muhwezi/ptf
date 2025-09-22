import { useState, useCallback, useMemo, useEffect } from 'react';
import { useApi, useApiMutation } from './useApi';
import { paymentService } from '../services/paymentService';

/**
 * Single optimized hook for all financial operations (payments and renewals)
 * Replaces usePayments.js and useRenewals.js to minimize file count
 */
export const useFinancials = (type = 'payments', initialParams = {}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [params, setParams] = useState({
    page: 1,
    limit: 50,
    ...initialParams
  });

  // Debounce search term to reduce API calls
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build optimized API parameters
  const apiParams = useMemo(() => ({
    ...params,
    search: debouncedSearchTerm || undefined,
    [type === 'renewals' ? 'urgency' : 'status']: filterStatus !== 'all' ? filterStatus : undefined,
  }), [params, debouncedSearchTerm, filterStatus, type]);

  // Single API function that handles both payments and renewals
  const apiFunction = useMemo(() => {
    return type === 'renewals'
      ? () => paymentService.getRenewalsDue(apiParams)
      : () => paymentService.getPaymentsDue(apiParams);
  }, [type, apiParams]);

  // Fetch data with caching
  const {
    data: apiResponse,
    loading,
    error,
    refetch
  } = useApi(apiFunction, [apiParams], {
    cacheKey: `${type}-data`,
    cacheTTL: 300000, // 5 minutes cache
    immediate: true
  });

  // Extract data and stats from API response
  const { data, stats } = useMemo(() => ({
    data: apiResponse?.results || apiResponse?.data || [],
    stats: apiResponse?.stats || {}
  }), [apiResponse]);

  // Client-side filtering for immediate feedback
  const filteredData = useMemo(() => {
    if (!data) return [];

    // Only apply client-side filter if search term is ahead of debounced term
    if (searchTerm && searchTerm !== debouncedSearchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      return data.filter(item =>
        item.first_name?.toLowerCase().includes(lowerSearch) ||
        item.last_name?.toLowerCase().includes(lowerSearch) ||
        item.email?.toLowerCase().includes(lowerSearch) ||
        item.member_id?.toString().includes(lowerSearch)
      );
    }

    return data;
  }, [data, searchTerm, debouncedSearchTerm]);

  // Mutation hooks with optimized error handling
  const processPayment = useApiMutation(paymentService.recordManualPayment, {
    onSuccess: () => refetch(),
    onError: (error) => console.error('Payment processing failed:', error)
  });

  const sendReminder = useApiMutation(paymentService.sendPaymentReminder, {
    onError: (error) => console.error('Reminder sending failed:', error)
  });

  const sendBulkReminders = useApiMutation(paymentService.sendBulkPaymentReminders, {
    onError: (error) => console.error('Bulk reminder sending failed:', error)
  });

  // Optimized action handlers
  const handleProcessPayment = useCallback(async (paymentData) => {
    return await processPayment.mutate(paymentData);
  }, [processPayment]);

  const handleSendReminder = useCallback(async (memberId, reminderData) => {
    return await sendReminder.mutate(memberId, reminderData);
  }, [sendReminder]);

  const handleBulkReminders = useCallback(async (memberIds, reminderData) => {
    return await sendBulkReminders.mutate(memberIds, reminderData);
  }, [sendBulkReminders]);

  // Update functions with optimized re-renders
  const updateSearchTerm = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const updateFilterStatus = useCallback((status) => {
    setFilterStatus(status);
  }, []);

  const updateParams = useCallback((newParams) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  return {
    // Data
    data: filteredData,
    stats,
    loading,
    error,

    // Filters
    searchTerm,
    filterStatus,
    updateSearchTerm,
    updateFilterStatus,
    updateParams,

    // Actions
    handleProcessPayment,
    handleSendReminder,
    handleBulkReminders,

    // Mutation states
    isProcessing: processPayment.loading,
    isLoading: sendReminder.loading || sendBulkReminders.loading,
    processingError: processPayment.error,
    reminderError: sendReminder.error || sendBulkReminders.error,

    // Utilities
    refetch,
    totalCount: apiResponse?.count || 0,
    pagination: apiResponse?.pagination || {}
  };
};

// Specialized hooks that use the main hook
export const usePaymentsDue = (params) => useFinancials('payments', params);
export const useRenewalsDue = (params) => useFinancials('renewals', params);

// Payment processor hook
export const usePaymentProcessor = () => {
  const processManualPayment = useApiMutation(paymentService.recordManualPayment);

  return {
    processManualPayment,
    isProcessing: processManualPayment.loading,
    error: processManualPayment.error,
    reset: processManualPayment.reset
  };
};

// Payment reminders hook
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

export default useFinancials;