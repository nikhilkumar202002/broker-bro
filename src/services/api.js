import axios from 'axios';
import toast from 'react-hot-toast'; // 1. Import toast

const api = axios.create({
  baseURL: 'https://developmentapi.realtybrokerbro.com/api',
  headers: {
    'Accept': 'application/json', 
  }
});

// Attach token to every request if present
api.interceptors.request.use((config) => {
 const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Dev-only debug: log auth header for category create/update requests
  try {
    if (process.env.NODE_ENV !== 'production') {
      const isCategoryEndpoint = /\/categories(\/|$)/.test(config.url || '');
      if (isCategoryEndpoint && ['post', 'put'].includes((config.method || '').toLowerCase())) {
        // eslint-disable-next-line no-console
        console.debug('[api] Sending category request', config.method, config.url, 'Auth:', config.headers?.Authorization);
      }
    }
  } catch (e) {
    // ignore logging errors
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
      // Dev-only: log error details for category endpoints to help debugging
      try {
        if (process.env.NODE_ENV !== 'production') {
          const url = error.config?.url ?? '';
          if (/\/categories(\/|$)/.test(url)) {
            // eslint-disable-next-line no-console
            console.debug('[api] Category request failed with 401:', url, error.response?.data);
          }
        }
      } catch (e) {}

      localStorage.removeItem('token');
      window.location.href = '/login'; 
    }

    // Reject the promise so the component calling the API knows it failed
    return Promise.reject(error);
  }
);

// Auth
export const login = (credentials) => api.post('/login', credentials);

// Logout - call backend and clear local token
export const logout = () =>
  api
    .post('/logout')
    .then((res) => {
      localStorage.removeItem('token');
      return res;
    })
    .catch((err) => {
      // Ensure local cleanup even if server logout fails
      localStorage.removeItem('token');
      return Promise.reject(err);
    });

// Categories
export const createCategory = (data) => {
  // If an image file is provided, send as multipart/form-data
  if (data?.image instanceof File || data?.image instanceof Blob) {
    const form = new FormData();
    form.append('name', data.name ?? '');
    form.append('description', data.description ?? '');
    if (typeof data.status !== 'undefined') form.append('status', String(data.status));
    form.append('image', data.image);
    // Let the browser/axios set the Content-Type (including boundary)
    return api.post('/categories', form);
  }

  return api.post('/categories', data);
};

export const updateCategory = (id, data) => {
  if (data?.image instanceof File || data?.image instanceof Blob) {
    const form = new FormData();
    if (typeof data.name !== 'undefined') form.append('name', data.name);
    if (typeof data.description !== 'undefined') form.append('description', data.description);
    if (typeof data.status !== 'undefined') form.append('status', String(data.status));
    form.append('image', data.image);
    // Let the browser/axios set the Content-Type (including boundary)
    return api.put(`/categories/${id}`, form);
  }

  return api.put(`/categories/${id}`, data);
};
// List / Get Categories (supports query params for admin view)
export const getCategories = (params) => api.get('/categories', { params });
export const deleteCategory = (id) => api.delete(`/categories/${id}`);
export const activateCategory = (id) => api.put(`/categories/${id}/activate`);
export const deactivateCategory = (id) => api.put(`/categories/${id}/deactivate`);

export default api;