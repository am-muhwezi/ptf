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
      throw new Error(error.response?.data?.message || 'Failed to create member');
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
      throw new Error(error.response?.data?.message || 'Failed to delete member');
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
      
      // Your Django backend returns { results: [], count: number, query: string }
      return {
        results: data.results || [],
        count: data.count || 0,
        query: data.query || query,
        hasMore: false // Since you limit to 10, implement pagination if needed
      };
    } catch (error) {
      console.error('Search API Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to search members');
    }
  },


  checkinMember: async (memberId) => {
    try {

      const response = await apiClient.post(`${API_ENDPOINTS.members.list}${memberId}/checkin/`);
      return response.data;
    } catch (error) {
      console.error('Check-in API Error:', error);
      throw new Error(error.response?.data?.error || 'Failed to check-in member');
    }
  },

  // Check-out member
  checkoutMember: async (memberId) => {
    try {
      const response = await apiClient.post(`${API_ENDPOINTS.members.list}${memberId}/checkout/`);
      return response.data;
    } catch (error) {
      console.error('Check-out API Error:', error);
      throw new Error(error.response?.data?.error || 'Failed to check-out member');
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
        responseType: 'blob' // Important: tells the client to expect a file
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to export members data');
    }
  },
};

export default memberService;