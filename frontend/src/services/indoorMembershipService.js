import apiClient, { API_ENDPOINTS } from '../config/api';

/**
 * Indoor Membership Service - Handles all indoor membership operations
 * Single responsibility: Indoor memberships only
 * 
 * @typedef {Object} IndoorMembershipData
 * @property {boolean} success - Operation success status
 * @property {Object} members - Member data with pagination
 * @property {Array} members.data - Array of member objects
 * @property {number} members.count - Total member count
 * @property {string|null} members.next - Next page URL
 * @property {string|null} members.previous - Previous page URL
 * @property {Object} stats - Indoor membership statistics
 * @property {number} stats.total_memberships - Total memberships
 * @property {number} stats.active_memberships - Active memberships
 * @property {number} stats.expiring_soon - Memberships expiring soon
 * @property {number} stats.total_revenue - Total revenue
 */
export const indoorMembershipService = {
  /**
   * Get all indoor membership data (members + stats) in one call
   * @param {Object} params - Query parameters for pagination/filtering
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=20] - Items per page
   * @param {string} [params.search] - Search term
   * @param {string} [params.status] - Filter by status
   * @returns {Promise<IndoorMembershipData>} Combined members and stats data
   */
  getAll: async (params = {}) => {
    console.count('🔵 IndoorService.getAll() called');
    console.log('🔵 IndoorService.getAll() params:', params);
    
    try {
      const [membersResponse, statsResponse] = await Promise.all([
        apiClient.get(API_ENDPOINTS.memberships.indoor, { params }),
        apiClient.get(API_ENDPOINTS.memberships.indoor_stats)
      ]);
      
      return {
        success: true,
        members: {
          data: membersResponse.data.results || membersResponse.data,
          count: membersResponse.data.count || 0,
          next: membersResponse.data.next,
          previous: membersResponse.data.previous
        },
        stats: statsResponse.data
      };
    } catch (error) {
      console.error('🔵 IndoorService.getAll() error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch indoor membership data');
    }
  },

  /**
   * Renew indoor membership
   * @param {string} membershipId - Membership ID to renew
   * @param {Object} renewalData - Renewal information
   * @returns {Promise<Object>} Renewal result
   */
  renewMembership: async (membershipId, renewalData) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.memberships.renew(membershipId), renewalData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to renew membership');
    }
  },

  /**
   * Suspend indoor member
   * @param {string} membershipId - Membership ID to suspend
   * @param {string} reason - Reason for suspension
   * @returns {Promise<Object>} Suspension result
   */
  suspendMember: async (membershipId, reason) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.memberships.suspend(membershipId), { reason });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to suspend member');
    }
  }
};

export default indoorMembershipService;