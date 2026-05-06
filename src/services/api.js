import axios from 'axios';
import toast from 'react-hot-toast'; // 1. Import toast

const api = axios.create({
  baseURL: 'https://developmentapi.realtybrokerbro.com/api',
});

// Attach token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Add Response Interceptor for Global Error Handling
api.interceptors.response.use(
  (response) => {
    // Any status code that lies within the range of 2xx causes this function to trigger.
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx causes this function to trigger.
    
    // Extract the error message from your specific API structure, with a safe fallback
    const errorMessage = 
      error.response?.data?.message || 
      error.response?.data?.error || 
      'Something went wrong. Please try again.';

    // Show the error toast globally
    toast.error(errorMessage);

    // Optional: Automatically log the user out if their token expires (401 Unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login'; 
    }

    // Reject the promise so the component calling the API knows it failed
    return Promise.reject(error);
  }
);

// Auth
export const login = (credentials) => api.post('/login', credentials);

export default api;