import apiClient, { API_ENDPOINTS } from '../config/api';

const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

const isTokenExpired = (token) => {
  if (!token) return true;
  
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

const fetchUserData = async () => {
  try {
    const response = await apiClient.get('/auth/user-info/');
    
    if (response.data) {
      const userData = {
        id: response.data.id,
        email: response.data.email,
        firstName: response.data.first_name,
        lastName: response.data.last_name,
        username: response.data.username,
        isStaff: response.data.is_staff,
        isActive: response.data.is_active,
        dateJoined: response.data.date_joined
      };
      
      localStorage.setItem('user_data', JSON.stringify(userData));
      return userData;
    }
    
    throw new Error('No user data received from server');
  } catch (error) {
    return null;
  }
};

const login = async (credentials) => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.auth.login, credentials);

    if (response.data && response.data.access && response.data.refresh) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      const userData = await Promise.race([
        fetchUserData(),
        new Promise(resolve => setTimeout(() => resolve(null), 5000))
      ]);

      if (userData) {
        return userData;
      } else {
        const tokenData = decodeToken(response.data.access);
        const minimalUser = {
          id: tokenData?.user_id,
          email: credentials.email,
          firstName: 'User',
          lastName: '',
        };
        
        localStorage.setItem('user_data', JSON.stringify(minimalUser));
        return minimalUser;
      }
    }

    throw new Error('Invalid login response from server');
  } catch (error) {
    clearAuthData();
    throw new Error(getLoginErrorMessage(error));
  }
};

const register = async (userData) => {
  try {
    clearAuthData();
    
    const response = await apiClient.post(API_ENDPOINTS.auth.register, userData);

    if (response.data?.access && response.data?.refresh) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      let fetchedUserData = null;
      let retries = 3;
      
      while (retries > 0 && !fetchedUserData) {
        fetchedUserData = await fetchUserData();
        if (!fetchedUserData) {
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      if (fetchedUserData) {
        return {
          success: true,
          autoLogin: true,
          userData: fetchedUserData,
          message: `Welcome to Paradise, ${fetchedUserData.firstName}! 🏝️`
        };
      } else {
        const fallbackUser = {
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          username: userData.username || `${userData.first_name.toLowerCase()}${userData.last_name.toLowerCase()}`
        };
        
        localStorage.setItem('user_data', JSON.stringify(fallbackUser));
        
        return {
          success: true,
          autoLogin: true,
          userData: fallbackUser,
          message: `Welcome to Paradise, ${fallbackUser.firstName}! 🏝️`
        };
      }
    }

    return {
      success: true,
      autoLogin: false,
      message: 'Account created successfully! Please sign in to continue.'
    };

  } catch (error) {
    clearAuthData();
    throw new Error(getRegistrationErrorMessage(error));
  }
};

const getLoginErrorMessage = (error) => {
  if (error.code === 'ERR_NETWORK' || !navigator.onLine) {
    return "🌐 Can't connect to our servers. Please check your internet connection and try again.";
  }

  if (error.response?.status === 400) {
    const errorData = error.response.data;
    
    if (errorData.non_field_errors) {
      const errorMsg = Array.isArray(errorData.non_field_errors) 
        ? errorData.non_field_errors[0] 
        : errorData.non_field_errors;
      
      if (errorMsg.includes('Invalid') || errorMsg.includes('credentials')) {
        return "🔒 Invalid email or password. Please check your credentials and try again.";
      }
    }
    
    if (errorData.email) {
      return "📧 Please enter a valid email address.";
    }
    
    if (errorData.password) {
      return "🔒 Password is required.";
    }
  }

  if (error.response?.status === 401) {
    return "🔒 Invalid email or password. Please check your credentials and try again.";
  }

  if (error.response?.status === 429) {
    return "⏰ Too many login attempts. Please wait a moment and try again.";
  }

  if (error.response?.status >= 500) {
    return "🔧 Our servers are having issues. Please try again in a few minutes.";
  }

  return "❌ Login failed. Please check your credentials and try again.";
};

const getRegistrationErrorMessage = (error) => {
  if (error.code === 'ERR_NETWORK' || !navigator.onLine) {
    return "🌐 Can't connect to our servers. Please check your internet connection and try again.";
  }

  if (error.response?.status === 400) {
    const errorData = error.response.data;
    
    if (errorData.email) {
      const emailError = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email;
      if (emailError.includes('already exists') || emailError.includes('unique')) {
        return "📧 This email is already registered. Try signing in instead!";
      }
      return "📧 Please enter a valid email address.";
    }
    
    if (errorData.password) {
      return "🔒 Password must be at least 6 characters long.";
    }
    
    if (errorData.first_name) {
      return "👤 Please enter your first name.";
    }
    
    if (errorData.last_name) {
      return "👤 Please enter your last name.";
    }
    
    if (errorData.username) {
      return "👤 This username is already taken. Please try a different one.";
    }
    
    if (errorData.non_field_errors) {
      const nonFieldError = Array.isArray(errorData.non_field_errors) 
        ? errorData.non_field_errors[0] 
        : errorData.non_field_errors;
      return nonFieldError;
    }

    return "❌ Please check your information and try again.";
  }

  if (error.response?.status >= 500) {
    return "🔧 Our servers are having issues. Please try again in a few minutes.";
  }

  return "❌ Registration failed. Please check your information and try again.";
};

const refreshToken = async () => {
  try {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post(API_ENDPOINTS.auth.refresh, {
      refresh: refresh
    });

    if (response.data && response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      return response.data.access;
    } else {
      throw new Error('Invalid refresh response');
    }
  } catch (error) {
    clearAuthData();
    throw error;
  }
};

const clearAuthData = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_data');
};

const logout = async () => {
  try {
    clearAuthData();
  } catch (error) {
    clearAuthData();
  }
};

const isAuthenticated = () => {
  const token = localStorage.getItem('access_token');
  const refreshTokenValue = localStorage.getItem('refresh_token');
  
  if (!token || !refreshTokenValue) {
    return false;
  }
  
  if (isTokenExpired(token)) {
    return !isTokenExpired(refreshTokenValue);
  }
  
  return true;
};

const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const parsed = JSON.parse(userData);
      
      if (parsed && typeof parsed === 'object') {
        return {
          ...parsed,
          firstName: parsed.firstName || parsed.first_name || 'User',
          lastName: parsed.lastName || parsed.last_name || ''
        };
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

const getAccessToken = () => {
  return localStorage.getItem('access_token');
};

const hasRole = (role) => {
  const user = getCurrentUser();
  if (!user) return false;
  
  return true;
};

const validateSession = async () => {
  try {
    const token = localStorage.getItem('access_token');
    const refreshTokenValue = localStorage.getItem('refresh_token');
    
    if (!token || !refreshTokenValue) {
      return false;
    }
    
    const userData = getCurrentUser();
    if (!userData && !isTokenExpired(token)) {
      await fetchUserData();
    }
    
    if (isTokenExpired(token)) {
      if (isTokenExpired(refreshTokenValue)) {
        clearAuthData();
        return false;
      }
      
      try {
        await refreshToken();
        return true;
      } catch (error) {
        clearAuthData();
        return false;
      }
    }
    
    return true;
  } catch (error) {
    clearAuthData();
    return false;
  }
};

const authService = {
  login,
  register,
  logout,
  refreshToken,
  isAuthenticated,
  getCurrentUser,
  getAccessToken,
  hasRole,
  validateSession,
  clearAuthData,
  fetchUserData
};

export default authService;