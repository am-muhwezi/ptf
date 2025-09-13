import apiClient, { API_ENDPOINTS } from '../config/api';

/**
 * Outdoor Membership Service - Handles all outdoor membership operations
 * Single responsibility: Outdoor memberships only
 * 
 * @typedef {Object} OutdoorMembershipData
 * @property {boolean} success - Operation success status
 * @property {Object} members - Member data with pagination
 * @property {Array} members.data - Array of member objects
 * @property {number} members.count - Total member count
 * @property {string|null} members.next - Next page URL
 * @property {string|null} members.previous - Previous page URL
 * @property {Object} stats - Outdoor membership statistics
 */
export const outdoorMembershipService = {
  /**
   * Get all outdoor membership data (members + stats) in one call
   * @param {Object} params - Query parameters for pagination/filtering
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=20] - Items per page
   * @param {string} [params.search] - Search term
   * @param {string} [params.status] - Filter by status
   * @returns {Promise<OutdoorMembershipData>} Combined members and stats data
   */
  getAll: async (params = {}) => {
    console.count('🟠 OutdoorService.getAll() called');
    console.log('🟠 OutdoorService.getAll() params:', params);
    
    try {
      // Fetch essential data only (members + stats)
      const [membersResponse, statsResponse] = await Promise.all([
        apiClient.get(API_ENDPOINTS.memberships.outdoor, { params }),
        apiClient.get(API_ENDPOINTS.memberships.outdoor_stats)
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
        // Note: Rate cards are hardcoded and not fetched from API
      };
    } catch (error) {
      console.error('🟠 OutdoorService.getAll() error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch outdoor membership data');
    }
  },

  /**
   * Use session (check-in) for outdoor member
   * @param {string} membershipId - Membership ID
   * @param {Object} sessionData - Session data
   * @returns {Promise<Object>} Session use result
   */
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
  }
};

export default outdoorMembershipService;