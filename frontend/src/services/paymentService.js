import apiClient, { API_ENDPOINTS } from '../config/api';

export const paymentService = {
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

  // Get payment history
  getPaymentHistory: async (memberId) => {
    try {
      const response = await apiClient.get(`/payments/history/${memberId}/`);
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

  // Record manual payment
  recordManualPayment: async (paymentData) => {
    try {
      const response = await apiClient.post('/payments/manual/', paymentData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to record manual payment');
    }
  }
};

export default paymentService;