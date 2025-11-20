import axios from 'axios';

// Base API URL - can be configured via environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://l6q0x9szcj.execute-api.ap-south-1.amazonaws.com'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Add auth header for:
      // 1. Admin routes
      // 2. Auth routes
      // 3. POST/PUT/DELETE/PATCH requests (write operations)
      // 4. GET requests with ?all=true (admin queries)
      // 5. Submissions routes (admin only)
      const method = (config.method || '').toLowerCase();
      const isAdminRoute = config.url?.includes('/admin') || config.url?.includes('/auth');
      const isSubmissionsRoute = config.url?.includes('/submissions') || config.url?.includes('/submission/');
      const isWriteOperation = method === 'post' || method === 'put' || method === 'delete' || method === 'patch';
      const isAdminQuery = config.url?.includes('?all=true');
      const requiresAuth = config.headers?.['X-Require-Auth'];
      
      if (isAdminRoute || isSubmissionsRoute || isWriteOperation || isAdminQuery || requiresAuth) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error for debugging
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - Backend server may not be running');
    } else if (error.message === 'Network Error') {
      console.error('Network Error - Cannot connect to backend. Make sure backend is running on', API_BASE_URL);
    } else if (!error.response) {
      console.error('No response from server - Backend may be down');
    }
    
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Export base URL for file access
export const getBaseUrl = () => {
  return API_BASE_URL.replace('/api', '');
};

export default api;

