import apiClient, { API_ENDPOINTS } from '../config/api';

/**
 * Dashboard Service - Handles all dashboard data operations
 * Single responsibility: Dashboard stats and notifications
 * 
 * @typedef {Object} DashboardData
 * @property {boolean} success - Operation success status
 * @property {Object} stats - Dashboard statistics
 * @property {Array} notifications - Notification array
 */
export const dashboardService = {
  /**
   * Get all dashboard data (stats + notifications) in one call
   * @returns {Promise<DashboardData>} Combined stats and notifications data
   */
  getAll: async () => {
    console.count('📊 DashboardService.getAll() called');
    console.log('📊 DashboardService.getAll() - fetching dashboard data');
    
    try {
      // Fetch essential data only (stats + notifications)
      const [statsResponse, notificationsResponse] = await Promise.all([
        apiClient.get(API_ENDPOINTS.dashboard.stats),
        apiClient.get(API_ENDPOINTS.dashboard.notifications)
      ]);
      
      return {
        success: true,
        stats: statsResponse.data,
        notifications: notificationsResponse.data
      };
    } catch (error) {
      console.error('📊 DashboardService.getAll() error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard data');
    }
  }
};

export default dashboardService;