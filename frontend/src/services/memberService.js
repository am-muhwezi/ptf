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


  
  
      
    
  
      
      
// Enhanced debugging version of checkinMember function
checkinMember: async (memberId) => {
  try {
    console.log('🔄 checkinMember called with:', memberId);
    console.log('🔄 memberId type:', typeof memberId);
    console.log('🔄 memberId stringified:', JSON.stringify(memberId));
    
    // Validate memberId before making the request
    if (!memberId || isNaN(Number(memberId))) {
      throw new Error(`Invalid member ID: ${memberId}`);
    }

    console.log('🔄 API_ENDPOINTS.members.list:', API_ENDPOINTS.members.list);
    
    // Ensure memberId is a number and construct URL carefully
    const cleanMemberId = Number(memberId);
    console.log('🔄 cleanMemberId:', cleanMemberId);
    
    // Remove trailing slash if it exists, then add proper path
    const baseUrl = API_ENDPOINTS.members.list;
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const checkInUrl = `${cleanBaseUrl}/${cleanMemberId}/checkin/`;
    
    console.log('🔄 Constructed check-in URL:', checkInUrl);

    // Make the request
    console.log('🔄 About to make POST request to:', checkInUrl);
    const response = await apiClient.post(checkInUrl);
    
    console.log('✅ Raw response:', response);
    console.log('✅ Response data:', response.data);
    console.log('✅ Response status:', response.status);
    
    return response.data;
  } catch (error) {
    console.error('❌ checkinMember error:', error);
    console.error('❌ Error response status:', error.response?.status);
    console.error('❌ Error response data:', error.response?.data);
    console.error('❌ Error config:', error.config);
    console.error('❌ Error config url:', error.config?.url);
    
    throw new Error(error.response?.data?.error || error.message || 'Failed to check-in member');
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
  }
};

export default memberService;