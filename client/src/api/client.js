import axios from 'axios';

const api = axios.create({
  baseURL: 'https://expenseflow-n0pm.onrender.com/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('expenseflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';

    // If 401 Unauthorized and not on login/register, clear auth token
    if (error.response?.status === 401) {
      const isAuthRoute =
        window.location.pathname === '/login' ||
        window.location.pathname === '/register';
      if (!isAuthRoute) {
        localStorage.removeItem('expenseflow_token');
        localStorage.removeItem('expenseflow_user');
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
