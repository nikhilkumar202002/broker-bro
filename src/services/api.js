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
  console.debug('[interceptor] Request to:', config.url, 'Method:', config.method, 'Token exists:', !!token);
  
  if (token) {
    // Ensure headers object exists
    if (!config.headers) {
      config.headers = {};
    }
    config.headers.Authorization = `Bearer ${token}`;
    console.debug('[interceptor] Set Authorization header');
  } else {
    console.warn('[interceptor] No token found in localStorage!');
  }
  
  // Dev-only debug: log auth header for category create/update requests
  try {
    if (process.env.NODE_ENV !== 'production') {
      const isCategoryEndpoint = /\/categories(\/|$)/.test(config.url || '');
      if (isCategoryEndpoint && ['post', 'put'].includes((config.method || '').toLowerCase())) {
        // eslint-disable-next-line no-console
        console.debug('[api] Sending category request', config.method, config.url, 'Auth:', config.headers?.Authorization ? 'YES' : 'NO');
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
    return response;
  },
  (error) => {
    const errorMessage = 
      error.response?.data?.message || 
      error.response?.data?.error || 
      'Something went wrong. Please try again.';
    toast.error(errorMessage);

    if (error.response?.status === 401) {
      try {
        if (process.env.NODE_ENV !== 'production') {
          const url = error.config?.url ?? '';
          // eslint-disable-next-line no-console
          console.error('[api] 401 Unauthorized:', url, error.response?.data);
          if (/\/categories(\/|$)/.test(url)) {
            // eslint-disable-next-line no-console
            console.debug('[api] Category request failed with 401:', url, error.response?.data);
          }
        }
      } catch (e) {}

    }

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
  const token = localStorage.getItem('token');
  console.debug('[createCategory] Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
  
  // If an image file is provided, send as multipart/form-data
  if (data?.image instanceof File || data?.image instanceof Blob) {
    const form = new FormData();
    form.append('name', data.name ?? '');
    form.append('description', data.description ?? '');
    if (typeof data.status !== 'undefined') form.append('status', String(data.status));
    form.append('image', data.image);
    
    console.debug('[createCategory] Sending FormData with image, token:', token ? 'present' : 'missing');
    // Rely on request interceptor to add Authorization header
    return api.post('/categories', form);
  }

  console.debug('[createCategory] Sending JSON data, token:', token ? 'present' : 'missing');
  return api.post('/categories', data);
};

export const updateCategory = (id, data) => {
  const token = localStorage.getItem('token');
  console.debug('[updateCategory] Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
  
  if (data?.image instanceof File || data?.image instanceof Blob) {
    const form = new FormData();
    if (typeof data.name !== 'undefined') form.append('name', data.name);
    if (typeof data.description !== 'undefined') form.append('description', data.description);
    if (typeof data.status !== 'undefined') form.append('status', String(data.status));
    form.append('image', data.image);
    
    console.debug('[updateCategory] Sending FormData with image, token:', token ? 'present' : 'missing');
    // Rely on request interceptor to add Authorization header
    return api.put(`/categories/${id}`, form);
  }

  console.debug('[updateCategory] Sending JSON data, token:', token ? 'present' : 'missing');
  return api.put(`/categories/${id}`, data);
};
// List / Get Categories (supports query params for admin view)
export const getCategories = (params) => api.get('/categories', { params });
export const deleteCategory = (id) => api.delete(`/categories/${id}`);
export const activateCategory = (id) => api.put(`/categories/${id}/activate`);
export const deactivateCategory = (id) => api.put(`/categories/${id}/deactivate`);

// Property Types
export const createPropertyType = (data) => {
  const token = localStorage.getItem('token');
  console.debug('[createPropertyType] Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
  
  // If an image file is provided, send as multipart/form-data
  if (data?.image instanceof File || data?.image instanceof Blob) {
    const form = new FormData();
    form.append('name', data.name ?? '');
    form.append('description', data.description ?? '');
    if (typeof data.status !== 'undefined') form.append('status', String(data.status));
    form.append('image', data.image);
    
    console.debug('[createPropertyType] Sending FormData with image, token:', token ? 'present' : 'missing');
    return api.post('/property-types', form);
  }

  console.debug('[createPropertyType] Sending JSON data, token:', token ? 'present' : 'missing');
  return api.post('/property-types', data);
};

export const updatePropertyType = (id, data) => {
  const token = localStorage.getItem('token');
  console.debug('[updatePropertyType] Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
  
  if (data?.image instanceof File || data?.image instanceof Blob) {
    const form = new FormData();
    if (typeof data.name !== 'undefined') form.append('name', data.name);
    if (typeof data.description !== 'undefined') form.append('description', data.description);
    if (typeof data.status !== 'undefined') form.append('status', String(data.status));
    form.append('image', data.image);
    
    console.debug('[updatePropertyType] Sending FormData with image, token:', token ? 'present' : 'missing');
    return api.put(`/property-types/${id}`, form);
  }

  console.debug('[updatePropertyType] Sending JSON data, token:', token ? 'present' : 'missing');
  return api.put(`/property-types/${id}`, data);
};

export const getPropertyTypes = (params) => api.get('/property-types', { params });
export const deletePropertyType = (id) => api.delete(`/property-types/${id}`);
export const activatePropertyType = (id) => api.put(`/property-types/${id}/activate`);
export const deactivatePropertyType = (id) => api.put(`/property-types/${id}/deactivate`);

// Users - list by role (e.g. /users?role=seller)
export const getUsers = (params) => api.get('/users', { params });
export const getSellers = (params) => getUsers({ ...(params || {}), role: 'seller' });
export const getCustomers = (params) => getUsers({ ...(params || {}), role: 'customer' });

export default api;