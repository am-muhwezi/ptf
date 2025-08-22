import apiClient, { API_ENDPOINTS } from '../config/api';

export const membershipService = {
  // Get all memberships
  getAllMemberships: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.memberships.list, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch memberships');
    }
  },

  // Indoor Memberships
  getIndoorMemberships: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.memberships.indoor, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch indoor memberships');
    }
  },

  // Outdoor Memberships
  getOutdoorMemberships: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.memberships.outdoor, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch outdoor memberships');
    }
  },

  // Renewals Due
  getRenewalsDue: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.memberships.renewals, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch renewals due');
    }
  },

  // Payments Due
  getPaymentsDue: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.memberships.payments, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payments due');
    }
  },

  // Renew Membership
  renewMembership: async (membershipId, renewalData) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.memberships.renew(membershipId), renewalData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to renew membership');
    }
  },

  // Suspend Member
  suspendMember: async (membershipId, reason) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.memberships.suspend(membershipId), { reason });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to suspend member');
    }
  },
};

export default membershipService;