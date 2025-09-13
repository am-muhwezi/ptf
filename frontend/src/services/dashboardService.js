import apiClient, { API_ENDPOINTS } from '../config/api';

/**
 * Dashboard Service - Handles dashboard statistics operations
 * Single responsibility: Dashboard stats only
 *
 * @typedef {Object} DashboardData
 * @property {boolean} success - Operation success status
 * @property {Object} stats - Dashboard statistics
 */
export const dashboardService = {
  /**
   * Get dashboard statistics
   * @returns {Promise<DashboardData>} Dashboard statistics data
   */
  getAll: async () => {
    try {
      const statsResponse = await apiClient.get(API_ENDPOINTS.dashboard.stats);
      return {
        success: true,
        stats: statsResponse.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard statistics');
    }
  }
};

export default dashboardService;