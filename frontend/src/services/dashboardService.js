import apiClient, { API_ENDPOINTS } from '../config/api';

export const dashboardService = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.dashboard.stats);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard statistics');
    }
  },

  // Get notifications
  getNotifications: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.dashboard.notifications);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch notifications');
    }
  },
};

export default dashboardService;