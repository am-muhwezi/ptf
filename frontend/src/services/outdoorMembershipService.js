import apiClient, { API_ENDPOINTS } from '../config/api';
import { memberCache, statsCache, CACHE_KEYS, CACHE_TTL } from '../utils/cache';

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
   * Get outdoor members with pagination and filtering (members only)
   * @param {Object} params - Query parameters for pagination/filtering
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=20] - Items per page
   * @param {string} [params.search] - Search term
   * @param {string} [params.status] - Filter by status
   * @returns {Promise<Object>} Paginated members data
   */
  getMembers: async (params = {}) => {
    console.count('🟠 OutdoorService.getMembers() called');
    console.log('🟠 OutdoorService.getMembers() params:', params);

    // Generate cache key
    const cacheKey = CACHE_KEYS.OUTDOOR_MEMBERS(
      params.page || 1,
      params.search,
      params.status,
      params.location
    );

    // Check cache first
    const cached = memberCache.get(cacheKey);
    if (cached) {
      console.log('📄 Using cached outdoor members data');
      return cached;
    }

    try {
      const response = await apiClient.get(API_ENDPOINTS.memberships.outdoor, { params });

      const result = {
        success: true,
        members: {
          data: response.data.results || response.data,
          count: response.data.pagination?.total_count || response.data.count || 0,
          next: response.data.pagination?.has_next ? `page=${(response.data.pagination?.page || 1) + 1}` : null,
          previous: response.data.pagination?.has_previous ? `page=${(response.data.pagination?.page || 1) - 1}` : null
        }
      };

      // Cache the result
      const ttl = params.search ? CACHE_TTL.SEARCH : CACHE_TTL.MEMBERS;
      memberCache.set(cacheKey, result, ttl);
      console.log('📄 Outdoor members data cached');

      return result;
    } catch (error) {
      console.error('🟠 OutdoorService.getMembers() error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch outdoor members');
    }
  },

  /**
   * Get outdoor membership statistics (stats only)
   * @returns {Promise<Object>} Stats data
   */
  getStats: async () => {
    console.count('🟠 OutdoorService.getStats() called');

    // Check cache first
    const cached = statsCache.get(CACHE_KEYS.OUTDOOR_STATS);
    if (cached) {
      console.log('📊 Using cached outdoor stats');
      return cached;
    }

    try {
      const response = await apiClient.get(API_ENDPOINTS.memberships.outdoor_stats);

      const result = {
        success: true,
        data: response.data?.data || response.data
      };

      // Cache the stats
      statsCache.set(CACHE_KEYS.OUTDOOR_STATS, result, CACHE_TTL.STATS);
      console.log('📊 Outdoor stats cached');

      return result;
    } catch (error) {
      console.error('🟠 OutdoorService.getStats() error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch outdoor membership stats');
    }
  },

  /**
   * Clear all cached data for outdoor memberships
   */
  clearCache: () => {
    memberCache.clear();
    statsCache.delete(CACHE_KEYS.OUTDOOR_STATS);
    console.log('🗑️ Outdoor membership cache cleared');
  },

  /**
   * DEPRECATED: Get all outdoor membership data (members + stats) in one call
   * Use getMembers() and getStats() separately instead
   * @deprecated
   */
  getAll: async (params = {}) => {
    console.warn('🟠 OutdoorService.getAll() is deprecated. Use getMembers() and getStats() separately.');

    try {
      // Fetch data separately for better performance and caching
      const [membersResponse, statsResponse] = await Promise.all([
        this.getMembers(params),
        this.getStats()
      ]);

      return {
        success: true,
        members: membersResponse.members,
        stats: statsResponse.data
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