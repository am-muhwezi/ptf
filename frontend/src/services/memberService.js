import apiClient, { API_ENDPOINTS } from '../config/api';

export const memberService = {
  // Get all members with pagination
  getMembers: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.members.list, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch members');
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
        // Create an error with the backend message
        const message = errorData.message || errorData.error || 'Failed to create member';
        console.log('Creating error with message:', message);
        
        const customError = new Error(message);
        
        // Attach field errors for form field highlighting
        if (errorData.field_errors || errorData.details) {
          customError.fieldErrors = errorData.field_errors || errorData.details;
          console.log('Attached field errors:', customError.fieldErrors);
        }
        
        throw customError;
      }
      
      // Fallback error
      throw new Error('Failed to create member - unknown error');
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

  // Search members - FIXED: Proper endpoint and error handling
  searchMembers: async (query, page = 1, limit = 10) => {
    try {
      // Ensure we're calling the correct endpoint
      const response = await apiClient.get(`${API_ENDPOINTS.members.list}`, {
        params: { 
          q: query,
          page: page,
          limit: limit
        }
      });
      
      // Handle the response structure from your Django backend
      const data = response.data;
      
      // Your Django backend returns { data: [], count: number, success: true }
      return {
        results: data.data || [],
        count: data.count || 0,
        query: data.query || query,
        hasMore: false // Since you limit to 10, implement pagination if needed
      };
    } catch (error) {
      console.error('Search API Error:', error);
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