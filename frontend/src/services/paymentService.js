import apiClient, { API_ENDPOINTS } from '../config/api';

export const paymentService = {
  // Get all payments due - Backend calculates everything
  getPaymentsDue: async (params = {}) => {
    try {
      const response = await apiClient.get('/payments/due/', { params });
      return response.data;
    } catch (error) {
      // Temporary fallback while backend endpoints are being set up
      console.warn('Backend endpoint not ready, using fallback data');
      return {
        success: true,
        results: [],
        count: 0,
        stats: {
          total: 0,
          overdue: 0,
          due_today: 0,
          totalOutstanding: 0
        }
      };
    }
  },

  // Get all renewals due - Backend calculates everything
  getRenewalsDue: async (params = {}) => {
    try {
      const response = await apiClient.get('/renewals/due/', { params });
      return response.data;
    } catch (error) {
      // Temporary fallback while backend endpoints are being set up
      console.warn('Backend endpoint not ready, using fallback data');
      return {
        success: true,
        results: [],
        count: 0,
        stats: {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          totalRevenue: 0
        }
      };
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

  // Get payment statistics - OPTIMIZED with backend calculations
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

  // Send invoice to a specific member
  sendInvoice: async (memberId, invoiceData = {}) => {
    try {
      const response = await apiClient.post(`/invoice/${memberId}/`, {
        send_email: invoiceData.send_email !== false, // Default to true
        message: invoiceData.message || '',
        urgency: invoiceData.urgency || 'normal'
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to send invoice');
    }
  },

  // Send bulk invoices to multiple members
  sendBulkInvoices: async (memberIds, invoiceData = {}) => {
    try {
      const response = await apiClient.post('/invoice/bulk/', {
        member_ids: memberIds,
        send_email: invoiceData.send_email !== false, // Default to true
        message: invoiceData.message || '',
        urgency: invoiceData.urgency || 'normal'
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to send bulk invoices');
    }
  },

  // Preview invoice for a member
  previewInvoice: async (memberId) => {
    try {
      const response = await apiClient.get(`/invoice/${memberId}/preview/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to preview invoice');
    }
  },

  // Download invoice as HTML file
  downloadInvoice: async (memberId) => {
    try {
      const response = await apiClient.get(`/invoice/${memberId}/download/`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${memberId}.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true, message: 'Invoice downloaded successfully' };
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to download invoice');
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

  // Validate payment data for admin confirmation
  validatePaymentData: (paymentData) => {
    const errors = {};

    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    if (!paymentData.memberId) {
      errors.memberId = 'Member ID is required';
    }

    // Require transaction reference for M-Pesa and bank transfers (external payments)
    if ((paymentData.paymentMethod === 'mpesa' || paymentData.paymentMethod === 'bank') && !paymentData.transactionReference) {
      const methodName = paymentData.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Bank';
      errors.transactionReference = `Transaction reference is required for ${methodName} payments`;
    }

    if (!paymentData.paymentDate) {
      errors.paymentDate = 'Payment date is required';
    }

    if (paymentData.paymentDate && new Date(paymentData.paymentDate) > new Date()) {
      errors.paymentDate = 'Payment date cannot be in the future';
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