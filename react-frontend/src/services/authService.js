import api from './api';

const authService = {
  // Login user
  login: async (email, password, role) => {
    try {
      // Get all users and find matching one
      const response = await api.get('/users/');
      const users = response.data.users || [];
      
      const user = users.find(u => u.email === email && u.role === role);
      
      if (user) {
        // Store user data
        localStorage.setItem('user', JSON.stringify(user));
        return { success: true, user };
      } else {
        return { success: false, message: 'Invalid credentials or role' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.error || 'Login failed' 
      };
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('user');
  },
};

export default authService;
