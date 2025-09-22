const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class AdminService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/admin`;
  }

  async getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');
    console.log('AdminService: Retrieved token from localStorage:', token ? 'Token found' : 'No token');
    console.log('AdminService: Current user data:', userData ? JSON.parse(userData) : 'No user data');

    if (!token) {
      throw new Error('No access token found. Please log in again.');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    console.log('AdminService: Auth headers prepared:', headers);
    return headers;
  }

  async handleResponse(response) {
    console.log('AdminService: Handling response:', response.status, response.statusText, response.url);

    // First check if we were redirected to a login page
    if (response.url && (response.url.includes('/login') || response.url.includes('/admin/login'))) {
      console.log('AdminService: Detected redirect to login page');
      throw new Error('Authentication required. Please log in again.');
    }

    const contentType = response.headers.get('content-type');
    console.log('AdminService: Response content-type:', contentType);

    // Always check content type first, even for successful responses
    if (contentType && contentType.includes('text/html')) {
      console.log('AdminService: Received HTML response, checking for login page');
      const textResponse = await response.text();
      console.log('AdminService: HTML response sample:', textResponse.substring(0, 300));

      if (textResponse.includes('login') || textResponse.includes('Login') ||
          textResponse.includes('csrf') || textResponse.includes('Django administration')) {
        throw new Error('Authentication required. Please log in again.');
      }

      throw new Error('API Error: Server returned HTML instead of JSON. Status: ' + response.status);
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;

      try {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.log('AdminService: Error response data:', errorData);
          errorMessage = errorData.message || errorData.error || errorData.detail || errorMessage;
        } else {
          const textResponse = await response.text();
          console.log('AdminService: Error response text:', textResponse.substring(0, 500));
          errorMessage = `Server error. Status: ${response.status}`;
        }
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
        errorMessage = `Failed to parse error response. Status: ${response.status}`;
      }

      console.error('AdminService: Final error message:', errorMessage);
      throw new Error(errorMessage);
    }

    // Handle successful response
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned invalid content type for successful response');
    }

    try {
      return await response.json();
    } catch (jsonError) {
      console.error('Failed to parse JSON response:', jsonError);
      throw new Error('Server returned invalid JSON response');
    }
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

  // ===== SESSION MANAGEMENT METHODS =====

  // Get all logged-in admin users
  async getLoggedInAdmins() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/sessions/logged-in/`, {
        method: 'GET',
        headers
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching logged-in admins:', error);
      throw error;
    }
  }

  // Get session statistics
  async getSessionStats() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/sessions/stats/`, {
        method: 'GET',
        headers
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching session stats:', error);
      throw error;
    }
  }

  // Force logout a user
  async forceLogoutUser(userId, forceSelfLogout = false) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/sessions/force-logout/${userId}/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ force_self_logout: forceSelfLogout })
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error forcing logout:', error);
      throw error;
    }
  }

  // Get user session information
  async getUserSessionInfo(userId = null) {
    try {
      const headers = await this.getAuthHeaders();
      const endpoint = userId
        ? `${this.baseURL}/sessions/user-info/${userId}/`
        : `${this.baseURL}/sessions/my-info/`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching user session info:', error);
      throw error;
    }
  }

  // OPTIMIZED: Combined method using the new optimized endpoint
  async getAdminDashboardData(forceRefresh = false) {
    console.log('AdminService: Attempting to fetch dashboard data...', { forceRefresh });

    try {
      const headers = await this.getAuthHeaders();
      const queryParams = forceRefresh ? '?force_refresh=true' : '';
      const url = `${this.baseURL}/dashboard/${queryParams}`;

      console.log('AdminService: Making request to:', url);
      console.log('AdminService: Request headers:', headers);

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      console.log('AdminService: Response status:', response.status, response.statusText);

      const data = await this.handleResponse(response);

      console.log('AdminService: Dashboard data received:', data);

      // Transform optimized response to expected format
      return {
        adminUsers: data.adminUsers || [],
        loggedInAdmins: data.loggedInAdmins || [],
        sessionStats: {
          currently_online: data.stats?.online || 0,
          total_admin_users: data.stats?.total || 0,
          active_sessions: data.stats?.active || 0,
          idle_sessions: data.stats?.idle || 0,
          total_sessions_today: data.stats?.today || 0,
          superuser_sessions: data.stats?.superusers || 0,
          offline_admins: data.stats?.offline || 0,
          last_updated: data.stats?.updated
        },
        totalAdmins: data.stats?.total || 0,
        loggedInStats: {
          total_logged_in: (data.loggedInAdmins || []).length,
          active_sessions: data.stats?.active || 0,
          idle_sessions: data.stats?.idle || 0
        },
        meta: {
          cached: data.cached || false,
          cache_age: data.cache_age || 0,
          last_updated: data.stats?.updated,
          refresh_recommended: data.meta?.refresh || 30
        }
      };
    } catch (error) {
      console.error('AdminService: Error fetching optimized dashboard data:', error);
      throw error; // Let the component handle the fallback
    }
  }

  // Cache invalidation method
  async invalidateCache() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/cache/invalidate/`, {
        method: 'POST',
        headers
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error invalidating cache:', error);
      throw error;
    }
  }
}

export default new AdminService();