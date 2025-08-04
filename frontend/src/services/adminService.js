const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class AdminService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/admin`;
  }

  async getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Get all admin users
  async getAdminUsers() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/admin-users/`, {
        method: 'GET',
        headers
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      throw error;
    }
  }

  // Create new admin user
  async createAdminUser(userData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/admin-users/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(userData)
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error creating admin user:', error);
      throw error;
    }
  }

  // Update admin user
  async updateAdminUser(userId, userData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/admin-users/${userId}/`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(userData)
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error updating admin user:', error);
      throw error;
    }
  }

  // Update admin permissions
  async updateAdminPermissions(userId, permissions) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/admin-users/${userId}/update_permissions/`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(permissions)
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error updating admin permissions:', error);
      throw error;
    }
  }

  // Reset admin password
  async resetAdminPassword(userId, newPassword) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/admin-users/${userId}/reset_password/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ new_password: newPassword })
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error resetting admin password:', error);
      throw error;
    }
  }

  // Delete admin user
  async deleteAdminUser(userId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/admin-users/${userId}/`, {
        method: 'DELETE',
        headers
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error deleting admin user:', error);
      throw error;
    }
  }

  // Get specific admin user
  async getAdminUser(userId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/admin-users/${userId}/`, {
        method: 'GET',
        headers
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching admin user:', error);
      throw error;
    }
  }
}

export default new AdminService();