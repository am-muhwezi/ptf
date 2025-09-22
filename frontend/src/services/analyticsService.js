import apiClient from '../config/api';
import { statsCache, CACHE_KEYS, CACHE_TTL } from '../utils/cache';

export const analyticsService = {
  /**
   * Get comprehensive analytics data from the new backend endpoint
   * All calculations are done on the backend for accuracy
   */
  getComprehensiveAnalytics: async (timeframe = 'month') => {
    console.count('📊 AnalyticsService.getComprehensiveAnalytics() called');

    const cacheKey = CACHE_KEYS.COMPREHENSIVE_ANALYTICS(timeframe);
    const cached = statsCache.get(cacheKey);

    if (cached) {
      console.log('📊 Using cached comprehensive analytics');
      return cached;
    }

    try {
      const response = await apiClient.get('/analytics/', {
        params: { timeframe }
      });

      if (response.data.success) {
        const result = {
          success: true,
          data: response.data.data
        };

        statsCache.set(cacheKey, result, CACHE_TTL.ANALYTICS);
        console.log('📊 Comprehensive analytics cached');

        return result;
      } else {
        throw new Error(response.data.error || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('📊 AnalyticsService.getComprehensiveAnalytics() error:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch comprehensive analytics');
    }
  },

  /**
   * Get outdoor-specific analytics
   */
  getOutdoorAnalytics: async (timeframe = 'month') => {
    console.count('📊 AnalyticsService.getOutdoorAnalytics() called');

    const cacheKey = CACHE_KEYS.OUTDOOR_ANALYTICS(timeframe);
    const cached = statsCache.get(cacheKey);

    if (cached) {
      console.log('📊 Using cached outdoor analytics');
      return cached;
    }

    try {
      const response = await apiClient.get('/analytics/outdoor/', {
        params: { timeframe }
      });

      if (response.data.success) {
        const result = {
          success: true,
          data: response.data.data
        };

        statsCache.set(cacheKey, result, CACHE_TTL.ANALYTICS);
        console.log('📊 Outdoor analytics cached');

        return result;
      } else {
        throw new Error(response.data.error || 'Failed to fetch outdoor analytics');
      }
    } catch (error) {
      console.error('📊 AnalyticsService.getOutdoorAnalytics() error:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch outdoor analytics');
    }
  },

  /**
   * Clear all analytics cache
   */
  clearCache: () => {
    const keys = [
      'COMPREHENSIVE_ANALYTICS',
      'OUTDOOR_ANALYTICS'
    ];

    keys.forEach(keyPrefix => {
      statsCache.deletePattern(keyPrefix);
    });

    console.log('🗑️ Analytics cache cleared');
  }
};

export default analyticsService;