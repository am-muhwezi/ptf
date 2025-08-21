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
  },

  // Get payments due
  getPaymentsDue: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.q) queryParams.append('q', params.q);
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params.page) queryParams.append('page', params.page);
      
      const response = await apiClient.get(`/memberships/memberships/payments_due/?${queryParams}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payments due');
    }
  },

  // Get renewals due
  getRenewalsDue: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.q) queryParams.append('q', params.q);
      if (params.urgency && params.urgency !== 'all') queryParams.append('urgency', params.urgency);
      if (params.page) queryParams.append('page', params.page);
      
      const response = await apiClient.get(`/memberships/memberships/renewals_due/?${queryParams}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch renewals due');
    }
  },

  // Record payment for membership
  recordMembershipPayment: async (membershipId, paymentData) => {
    try {
      const response = await apiClient.post(`/memberships/memberships/${membershipId}/record_payment/`, paymentData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to record payment');
    }
  },

  // Send payment reminder
  sendPaymentReminder: async (membershipId, reminderData) => {
    try {
      const response = await apiClient.post(`/memberships/memberships/${membershipId}/send_payment_reminder/`, reminderData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send payment reminder');
    }
  },

  // Send bulk reminders
  sendBulkReminders: async (reminderData) => {
    try {
      const response = await apiClient.post('/memberships/memberships/send_bulk_reminders/', reminderData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send bulk reminders');
    }
  },

  // Process renewal
  processRenewal: async (membershipId) => {
    try {
      const response = await apiClient.post(`/memberships/memberships/${membershipId}/process_renewal/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to process renewal');
    }
  },

  // Get payment statistics
  getPaymentStats: async () => {
    try {
      const response = await apiClient.get('/memberships/memberships/payment_stats/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payment statistics');
    }
  },

  // Get renewal statistics
  getRenewalStats: async () => {
    try {
      const response = await apiClient.get('/memberships/memberships/renewal_stats/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch renewal statistics');
    }
  }
};

export default paymentService;