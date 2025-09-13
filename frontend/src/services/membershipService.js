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

  // Indoor Members
  getIndoorMembers: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.memberships.indoor, { params });
      
      // Transform to expected format
      return {
        success: true,
        data: response.data.results || response.data,
        count: response.data.count || 0,
        next: response.data.next,
        previous: response.data.previous
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch indoor members');
    }
  },

  // Indoor Membership Stats
  getIndoorMembershipStats: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.memberships.indoor_stats);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch indoor membership stats');
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

  // Get Outdoor Members (alias for getOutdoorMemberships with proper response format)
  getOutdoorMembers: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.memberships.outdoor, { params });
      return {
        success: true,
        data: response.data.results || response.data,
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch outdoor members');
    }
  },

  // Get Outdoor Membership Statistics
  getOutdoorMembershipStats: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.memberships.outdoor_stats);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch outdoor membership stats');
    }
  },

  // Get Outdoor Rate Cards (Membership Plans)
  getOutdoorRateCards: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.memberships.plans);
      return {
        success: true,
        data: response.data.filter(plan => plan.membership_type === 'outdoor')
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch outdoor rate cards');
    }
  },

  // Create Outdoor Member
  createOutdoorMember: async (memberData) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.memberships.create, {
        ...memberData,
        membership_type: 'outdoor'
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create outdoor member');
    }
  },

  // Update Outdoor Member
  updateOutdoorMember: async (memberId, memberData) => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.memberships.update(memberId), memberData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update outdoor member');
    }
  },

  // Delete Outdoor Member
  deleteOutdoorMember: async (memberId) => {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.memberships.delete(memberId));
      return {
        success: true,
        data: response.data,
        message: 'Outdoor member deleted successfully'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete outdoor member');
    }
  },

  // Use Session (Check-in)
  useSession: async (membershipId, sessionData) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.memberships.use_session(membershipId), sessionData);
      return {
        success: true,
        data: response.data,
        message: 'Session used successfully'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to use session');
    }
  },
};

export default membershipService;