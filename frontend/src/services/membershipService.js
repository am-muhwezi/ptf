import apiClient, { API_ENDPOINTS } from '../config/api';

export const membershipService = {
  // Get all memberships - optimized with caching
  getAllMemberships: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.memberships.all, { params });
      return {
        success: true,
        data: response.data.data || response.data.results || response.data,
        count: response.data.count || response.data.total || 0,
        next: response.data.next,
        previous: response.data.previous
      };
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
      const response = await apiClient.get('/renewals/due/', { params });
      return {
        success: true,
        data: response.data.results || response.data,
        count: response.data.count || 0,
        stats: response.data.stats || {}
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch renewals due');
    }
  },

  // Payments Due
  getPaymentsDue: async (params = {}) => {
    try {
      const response = await apiClient.get('/payments/due/', { params });
      return {
        success: true,
        data: response.data.results || response.data,
        count: response.data.count || 0,
        stats: response.data.stats || {}
      };
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

  // Get renewal statistics
  getRenewalStats: async (params = {}) => {
    try {
      const response = await apiClient.get('/renewals/stats/', { params });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch renewal statistics');
    }
  },

  // Batch API operations for optimization
  batchOperations: {
    // Get dashboard data in one call
    getDashboardData: async () => {
      try {
        const [memberStats, paymentsDue, renewalsDue] = await Promise.all([
          membershipService.getIndoorMembershipStats(),
          membershipService.getPaymentsDue({ limit: 5 }),
          membershipService.getRenewalsDue({ limit: 5 })
        ]);

        return {
          success: true,
          data: {
            memberStats: memberStats.data,
            paymentsDue: paymentsDue.data,
            renewalsDue: renewalsDue.data
          }
        };
      } catch (error) {
        throw new Error('Failed to fetch dashboard data');
      }
    },

    // Get payments and renewals overview
    getPaymentsRenewalsOverview: async (params = {}) => {
      try {
        const [payments, renewals] = await Promise.all([
          membershipService.getPaymentsDue(params),
          membershipService.getRenewalsDue(params)
        ]);

        return {
          success: true,
          data: {
            payments: payments.data,
            renewals: renewals.data,
            combinedStats: {
              totalOutstanding: payments.stats?.totalOutstanding || 0,
              totalRenewalsValue: renewals.stats?.totalRevenue || 0,
              urgentItems: (payments.stats?.overdue || 0) + (renewals.stats?.critical || 0)
            }
          }
        };
      } catch (error) {
        throw new Error('Failed to fetch payments and renewals overview');
      }
    }
  },

  // Cache management
  cache: {
    clear: () => {
      // Clear specific caches if needed
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('membership_cache_')) {
            localStorage.removeItem(key);
          }
        });
      }
    },

    set: (key, data, ttl = 300000) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cacheData = {
          data,
          timestamp: Date.now(),
          ttl
        };
        localStorage.setItem(`membership_cache_${key}`, JSON.stringify(cacheData));
      }
    },

    get: (key) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cached = localStorage.getItem(`membership_cache_${key}`);
        if (cached) {
          const cacheData = JSON.parse(cached);
          if (Date.now() - cacheData.timestamp < cacheData.ttl) {
            return cacheData.data;
          } else {
            localStorage.removeItem(`membership_cache_${key}`);
          }
        }
      }
      return null;
    }
  }
};

export default membershipService;