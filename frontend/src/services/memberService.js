import apiClient, { API_ENDPOINTS } from '../config/api';

export const memberService = {
  // Get all members
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

  // Search members
  searchMembers: async (query) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.members.search, {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to search members');
    }
  },

  // Check-in member
  checkinMember: async (memberId) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.members.checkin(memberId));
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to check-in member');
    }
  }
};

export default memberService;