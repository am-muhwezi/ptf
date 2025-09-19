import apiClient, { API_ENDPOINTS } from '../config/api';
import { memberCache, statsCache, CACHE_KEYS, CACHE_TTL } from '../utils/cache';

export const memberService = {
  // Get members summary stats (fast, lightweight - following dashboard pattern)
  getSummary: async () => {
    console.count('🟠 MemberService.getSummary() called');

    // Check cache first
    const cached = statsCache.get(CACHE_KEYS.ALL_MEMBERS_STATS);
    if (cached) {
      console.log('📊 Using cached all members stats');
      return cached;
    }

    try {
      const response = await apiClient.get('/summary/');
      const result = {
        success: true,
        stats: response.data
      };

      // Cache the stats
      statsCache.set(CACHE_KEYS.ALL_MEMBERS_STATS, result, CACHE_TTL.STATS);
      console.log('📊 All members stats cached');

      return result;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch members summary');
    }
  },

  // Get stats only from hybrid endpoint
  getStatsOnly: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.members.list, {
        params: { stats: 'true' }
      });
      return {
        success: true,
        stats: response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch members stats');
    }
  },

  // Get all members with pagination (following outdoor membership pattern)
  getMembers: async (params = {}) => {
    console.count('🟠 MemberService.getMembers() called');
    console.log('🟠 MemberService.getMembers() params:', params);

    // Generate cache key
    const cacheKey = CACHE_KEYS.ALL_MEMBERS(
      params.page || 1,
      params.search,
      params.status,
      params.membership_type
    );

    // Check cache first
    const cached = memberCache.get(cacheKey);
    if (cached) {
      console.log('📄 Using cached all members data');
      return cached;
    }

    try {
      // Normalize parameters to match backend expectations
      const normalizedParams = {
        ...params,
        search: params.search || params.q, // Support both search and q parameters
        status: params.status !== 'all' ? params.status : undefined,
        membership_type: params.membership_type !== 'all' ? params.membership_type : undefined,
        page: params.page || 1,
        limit: params.limit || 20
      };

      // Remove undefined values
      Object.keys(normalizedParams).forEach(key => {
        if (normalizedParams[key] === undefined) {
          delete normalizedParams[key];
        }
      });

      const response = await apiClient.get(API_ENDPOINTS.members.list, { params: normalizedParams });

      // Transform response to match outdoor membership pattern
      const result = {
        success: true,
        members: {
          data: response.data.data || response.data.results || response.data,
          count: response.data.count || 0,
          next: response.data.pagination?.has_next ? `page=${(response.data.pagination?.page || 1) + 1}` : null,
          previous: response.data.pagination?.has_previous ? `page=${(response.data.pagination?.page || 1) - 1}` : null
        }
      };

      // Cache the result
      const ttl = params.search ? CACHE_TTL.SEARCH : CACHE_TTL.MEMBERS;
      memberCache.set(cacheKey, result, ttl);
      console.log('📄 All members data cached');

      return result;
    } catch (error) {
      console.error('🟠 MemberService.getMembers() error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch all members');
    }
  },

  // Create new member
  createMember: async (memberData) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.members.create, memberData);
      return response.data;
    } catch (error) {
      console.error('Member creation error:', error.response?.data);
      
      // Enhanced error handling for detailed backend responses
      const errorData = error.response?.data;
      console.log('Error data received:', errorData);
      
      if (errorData) {
        let userFriendlyMessage = '';
        const rawError = errorData.message || errorData.error || '';
        
        // Convert specific backend errors to user-friendly messages
        if (rawError.includes('UNIQUE constraint failed: members_member.email')) {
          userFriendlyMessage = 'This email address is already registered. Please use a different email address.';
        } else if (rawError.includes('UNIQUE constraint failed: members_member.phone')) {
          userFriendlyMessage = 'This phone number is already registered. Please use a different phone number.';
        } else if (rawError.includes('UNIQUE constraint failed: members_member.id_passport')) {
          userFriendlyMessage = 'This ID/Passport number is already registered. Please check the number.';
        } else if (rawError.includes('invalid date format')) {
          userFriendlyMessage = 'Date of birth must be in YYYY-MM-DD format or left empty.';
        } else if (rawError.includes('NOT NULL constraint failed')) {
          userFriendlyMessage = 'A required field is missing. Please check all required fields.';
        } else if (rawError.includes('membership_type is required')) {
          userFriendlyMessage = 'Please select a membership type (Indoor or Outdoor).';
        } else if (rawError.includes('plan_type is required')) {
          userFriendlyMessage = 'Please select a plan type for your membership.';
        } else if (rawError.includes('Dance class location is required')) {
          userFriendlyMessage = 'Please select a dance class location for outdoor membership.';
        } else {
          // Use the backend message if we don't have a specific translation
          userFriendlyMessage = rawError || 'Failed to create member';
        }
        
        console.log('Creating error with user-friendly message:', userFriendlyMessage);
        
        const customError = new Error(userFriendlyMessage);
        
        // Attach field errors for form field highlighting
        if (errorData.field_errors || errorData.details) {
          customError.fieldErrors = errorData.field_errors || errorData.details;
          console.log('Attached field errors:', customError.fieldErrors);
        }
        
        throw customError;
      }
      
      // Fallback error
      throw new Error('Failed to create member - please try again or contact support');
    }
  },

  // Get member by ID
  getMemberById: async (memberId) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.members.detail(memberId));
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch member details');
    }
  },

  // Update member
  updateMember: async (memberId, memberData) => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.members.update(memberId), memberData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update member');
    }
  },

  // Delete member
  deleteMember: async (memberId) => {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.members.delete(memberId));
      return response.data;
    } catch (error) {
      const errorData = error.response?.data;
      const message = errorData?.message || errorData?.error || 'Failed to delete member';
      throw new Error(message);
    }
  },

  // Search members - Using optimized search endpoint
  searchMembers: async (query, page = 1, limit = 20) => {
    try {
      console.log('🔍 Using optimized search endpoint for:', query);

      // Use the new optimized search endpoint
      const response = await apiClient.get(API_ENDPOINTS.members.search, {
        params: {
          q: query,
          limit: limit
        }
      });

      console.log('🔍 Search response:', response.data);

      // The new endpoint returns results directly
      return {
        results: response.data.results || [],
        count: response.data.count || 0,
        query: query,
        hasMore: false // Our optimized endpoint returns limited results
      };
    } catch (error) {
      console.error('🔍 Search API Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to search members');
    }
  },



  // Get outdoor memberships
  getOutdoorMemberships: async () => {
    try {
    

      const response = await apiClient.get(`${API_ENDPOINTS.members.list}outdoorMemberships/`);
      return response.data;

  
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch outdoor memberships');
    }
  },
  // Update member status
updateMemberStatus: async (memberId, status) => {
  try {
    // A PATCH request is best for updating a single field
    const response = await apiClient.patch(API_ENDPOINTS.members.update(memberId), { status });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update member status');
  }
},

  // Get indoor memberships
  getIndoorMemberships: async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.members.list}indoorMemberships/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch indoor memberships');
    }
  },

  // Get checked-in members
  getCheckedInMembers: async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.members.list}checked_in_members/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch checked-in members');
    }
  },
  /**
   * Export members data
   * @param {string} format - Export format (e.g., 'csv', 'excel')
   * @returns {Promise<Blob>} The file as a Blob
   */
  exportMembers: async (format = 'csv') => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.members.list, {
        params: { export: format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to export members data');
    }
  },

  // Process payment for member
  processPayment: async (memberId, paymentData) => {
    try {
      const response = await apiClient.post(`/payments/process/${memberId}/`, paymentData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to process payment');
    }
  },

  // Send payment reminder
  sendPaymentReminder: async (memberId, reminderData) => {
    try {
      const response = await apiClient.post(`/payments/reminder/${memberId}/`, reminderData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send payment reminder');
    }
  },

  // Update member profile
  updateMemberProfile: async (memberId, profileData) => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.members.update(memberId), profileData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update member profile');
    }
  },

  /**
   * Clear all cached data for members
   */
  clearCache: () => {
    memberCache.clear();
    statsCache.delete(CACHE_KEYS.ALL_MEMBERS_STATS);
    console.log('🗑️ All members cache cleared');
  },

};

export default memberService;

/**
 * Member Service API Documentation
 * 
 * This service handles all member-related API operations including:
 * - CRUD operations for members
 * - Member search and filtering
 * - Membership type management (indoor/outdoor)
 * - Payment processing
 * - Check-in functionality
 * - Data export capabilities
 * 
 * All functions return promises and include proper error handling
 * with descriptive error messages for UI feedback.
 */