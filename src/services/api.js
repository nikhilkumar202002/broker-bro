import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://brokerbroapi.realtybrokerbro.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
});

const getToken = () => localStorage.getItem('token');


const normalizeEntity = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeEntity);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const normalized = Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, normalizeEntity(item)])
  );

  if (normalized._id && !normalized.id) {
    normalized.id = normalized._id;
  }

  if (typeof normalized.role === 'string') {
    normalized.role = { name: normalized.role };
  }

  if (typeof normalized.mobile === 'undefined') {
    normalized.mobile = '';
  }

  return normalized;
};

const toFormData = (data) => {
  const form = new FormData();

  Object.entries(data || {}).forEach(([key, value]) => {
    if (typeof value !== 'undefined' && value !== null) {
      form.append(key, value);
    }
  });

  return form;
};

const hasUpload = (data) =>
  Object.values(data || {}).some((value) => value instanceof File || value instanceof Blob);

const withUploadSupport = (data) => (hasUpload(data) ? toFormData(data) : data);

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => ({
    ...response,
    data: normalizeEntity(response.data),
  }),
  (error) => {
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Something went wrong. Please try again.';

    toast.error(errorMessage);
    return Promise.reject(error);
  }
);

// Auth
export const login = (credentials) => api.post('/users/login', credentials);

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  return Promise.resolve({ data: { success: true } });
};

// Categories
export const createCategory = (data) => api.post('/categories', withUploadSupport(data));
export const updateCategory = (id, data) => api.put(`/categories/${id}`, withUploadSupport(data));
export const getCategories = (params) => api.get('/categories', { params });
export const deleteCategory = (id) => api.delete(`/categories/${id}`);
export const activateCategory = (id) => api.put(`/categories/${id}/activate`);
export const deactivateCategory = (id) => api.put(`/categories/${id}/deactivate`);

// Property Types
export const createPropertyType = (data) => api.post('/property-types', withUploadSupport(data));
export const updatePropertyType = (id, data) => api.put(`/property-types/${id}`, withUploadSupport(data));
export const getPropertyTypes = (params) => api.get('/property-types', { params });
export const deletePropertyType = (id) => api.delete(`/property-types/${id}`);
export const activatePropertyType = (id) => api.put(`/property-types/${id}/activate`);
export const deactivatePropertyType = (id) => api.put(`/property-types/${id}/deactivate`);

// Amenities
export const getAmenities = (params) => api.get('/amenities', { params });
export const createAmenity = (data) => api.post('/amenities', withUploadSupport(data));

// Facilities
export const getFacilities = (params) => api.get('/facilities', { params });
export const createFacility = (data) => api.post('/facilities', withUploadSupport(data));

// Properties
export const getProperties = (params) => api.get('/properties', { params });
export const getProperty = (id) => api.get(`/properties/${id}`);
export const approveProperty = (id) => api.put(`/properties/${id}/approve`);

// Users
export const getUsers = (params) => api.get('/users', { params });
export const getSellers = (params) => getUsers({ ...(params || {}), role: 'seller' });
export const getCustomers = (params) => getUsers({ ...(params || {}), role: 'user' });
export const activateUser = (id) => api.patch(`/users/${id}/activate-seller`);
export const deactivateUser = (id) => api.patch(`/users/${id}/deactivate-seller`);
export const getActiveSellers = (params) => getUsers({ ...(params || {}), role: 'seller', is_activated: 1 });
export const getInactiveSellers = (params) => getUsers({ ...(params || {}), role: 'seller', is_activated: 0 });

export default api;
