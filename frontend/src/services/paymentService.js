import apiClient, { API_ENDPOINTS } from '../config/api';

export const paymentService = {
  // Get all payments due
  getPaymentsDue: async (params = {}) => {
    try {
      const response = await apiClient.get('/payments/due/', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payments due');
    }
  },

  // Initiate M-Pesa payment
  initiateMpesaPayment: async (paymentData) => {
    try {
      const response = await apiClient.post('/payments/mpesa/initiate/', paymentData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to initiate M-Pesa payment');
    }
  },

  // Check payment status
  checkPaymentStatus: async (transactionId) => {
    try {
      const response = await apiClient.get(`/payments/status/${transactionId}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to check payment status');
    }
  },

  // Get payment history for a member
  getPaymentHistory: async (memberId, params = {}) => {
    try {
      const response = await apiClient.get(`/payments/history/${memberId}/`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payment history');
    }
  },

  // Get all payment history with filtering
  getAllPaymentHistory: async (params = {}) => {
    try {
      const response = await apiClient.get('/payments/history/', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payment history');
    }
  },

  // Generate receipt
  generateReceipt: async (paymentId) => {
    try {
      const response = await apiClient.get(`/payments/receipt/${paymentId}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate receipt');
    }
  },

  // Send payment reminder
  sendPaymentReminder: async (memberId, reminderData) => {
    try {
      const response = await apiClient.post(`/payments/reminder/${memberId}/`, reminderData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send payment reminder');
    }
  },

  // Send bulk payment reminders
  sendBulkPaymentReminders: async (memberIds, reminderData) => {
    try {
      const response = await apiClient.post('/payments/reminder/bulk/', {
        memberIds,
        ...reminderData
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send bulk payment reminders');
    }
  },

  // Record manual payment
  recordManualPayment: async (paymentData) => {
    try {
      const response = await apiClient.post('/payments/manual/', paymentData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to record manual payment');
    }
  },

  // Process payment (general method)
  processPayment: async (paymentData) => {
    try {
      const response = await apiClient.post('/payments/process/', paymentData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to process payment');
    }
  },

  // Get payment statistics
  getPaymentStats: async (params = {}) => {
    try {
      const response = await apiClient.get('/payments/stats/', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payment statistics');
    }
  },

  // Cancel payment
  cancelPayment: async (paymentId, reason) => {
    try {
      const response = await apiClient.post(`/payments/${paymentId}/cancel/`, { reason });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to cancel payment');
    }
  },

  // Refund payment
  refundPayment: async (paymentId, refundData) => {
    try {
      const response = await apiClient.post(`/payments/${paymentId}/refund/`, refundData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to refund payment');
    }
  },

  // Export payment data
  exportPayments: async (format = 'csv', params = {}) => {
    try {
      const response = await apiClient.get('/payments/export/', {
        params: { format, ...params },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to export payment data');
    }
  },

  // Send invoice
  sendInvoice: async (memberId, invoiceData) => {
    try {
      const response = await apiClient.post(`/payments/invoice/${memberId}/`, invoiceData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send invoice');
    }
  },

  // Format phone number for M-Pesa
  formatPhoneNumber: (phone) => {
    let cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    }
    
    if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }
    
    return cleaned;
  },

  // Validate payment data
  validatePaymentData: (paymentData) => {
    const errors = {};
    
    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }
    
    if (!paymentData.memberId) {
      errors.memberId = 'Member ID is required';
    }
    
    if (paymentData.paymentMethod === 'mpesa' && !paymentData.phoneNumber) {
      errors.phoneNumber = 'Phone number is required for M-Pesa payments';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

export default paymentService;

/**
 * Payment Service API Documentation
 * 
 * This service handles all payment-related API operations including:
 * - Payment processing (M-Pesa, manual, etc.)
 * - Payment history and tracking
 * - Reminders and notifications
 * - Receipt generation
 * - Payment statistics and reporting
 * - Data export capabilities
 * 
 * All functions return promises and include proper error handling
 * with descriptive error messages for UI feedback.
 * 
 * Payment Methods Supported:
 * - M-Pesa STK Push
 * - Manual/Cash payments
 * - Bank transfers
 * - Credit card processing
 */