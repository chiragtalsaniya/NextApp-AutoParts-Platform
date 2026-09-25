import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:3001/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const originalRequest = error.config as typeof error.config & { _retry?: boolean };
      const refreshToken = localStorage.getItem('refresh_token');

      if (error.response.status === 401 && refreshToken && !originalRequest?._retry && !originalRequest?.url?.includes('/auth/')) {
        originalRequest._retry = true;
        try {
          const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const nextToken = refreshResponse.data.token;
          const nextRefreshToken = refreshResponse.data.refreshToken;
          localStorage.setItem('auth_token', nextToken);
          if (nextRefreshToken) localStorage.setItem('refresh_token', nextRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${nextToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
        }
      }

      if (error.response.status === 401) {
        // Only redirect if we're not already on the login page
        const isOnLogin = window.location.pathname === '/login' || window.location.pathname === '/unauthorized';
        if (!isOnLogin) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;