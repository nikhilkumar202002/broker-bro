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
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item !== 'undefined' && item !== null && item !== '') {
          form.append(key, item);
        }
      });
    } else if (typeof value !== 'undefined' && value !== null) {
      form.append(key, value);
    }
  });

  return form;
};

const hasUpload = (data) =>
  Object.values(data || {}).some((value) =>
    Array.isArray(value)
      ? value.some((item) => item instanceof File || item instanceof Blob)
      : value instanceof File || value instanceof Blob
  );

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

// Property Categories
export const createCategory = (data) => api.post('/property-categories', withUploadSupport(data));
export const updateCategory = (id, data) => api.put(`/property-categories/${id}`, withUploadSupport(data));
export const getCategories = (params) => api.get('/property-categories', { params });
export const getActiveCategories = (params) => getCategories({ ...(params || {}), status: 'active' });
export const getInactiveCategories = (params) => getCategories({ ...(params || {}), status: 'inactive' });
export const deleteCategory = (id) => api.delete(`/property-categories/${id}`);
export const activateCategory = (id) => updateCategory(id, { status: 'active' });
export const deactivateCategory = (id) => updateCategory(id, { status: 'inactive' });

// Property Types
export const createPropertyType = (data) => api.post('/property-types', withUploadSupport(data));
export const updatePropertyType = (id, data) => api.put(`/property-types/${id}`, withUploadSupport(data));
export const getPropertyTypes = (params) => api.get('/property-types', { params });
export const getActivePropertyTypes = (params) => getPropertyTypes({ ...(params || {}), status: 'active' });
export const getInactivePropertyTypes = (params) => getPropertyTypes({ ...(params || {}), status: 'inactive' });
export const deletePropertyType = (id) => api.delete(`/property-types/${id}`);
export const activatePropertyType = (id) => api.put(`/property-types/${id}/activate`);
export const deactivatePropertyType = (id) => api.put(`/property-types/${id}/deactivate`);

// Amenities
export const getAmenities = (params) => api.get('/amenities', { params });
export const createAmenity = (data) => api.post('/amenities', withUploadSupport(data));

// Facilities
export const getFacilities = (params) => api.get('/facilities', { params });
export const createFacility = (data) => api.post('/facilities', withUploadSupport(data));

// World
export const getCountries = (params) => api.get('/countries', { params });
export const getCountryStatesDistricts = (id, params) => api.get(`/countries/${id}/states-districts`, { params });
export const getStates = (params) => api.get('/states', { params });
export const getDistricts = (params) => api.get('/districts', { params });

// Properties
export const createProperty = (data) => api.post('/properties', withUploadSupport(data));
export const updateProperty = (id, data) => api.put(`/properties/${id}`, withUploadSupport(data));
export const getProperties = (params) => api.get('/properties', { params });
export const getPropertyStatuses = (params) => api.get('/property-statuses', { params });
export const getAllProperties = (params) => getProperties(params);
export const getNotApprovedProperties = (params) => getProperties({ ...(params || {}), is_approved: null });
export const getApprovedProperties = (params) => getProperties({ ...(params || {}), is_approved: true });
export const getRejectedProperties = (params) => getProperties({ ...(params || {}), is_approved: false });
export const getProperty = (id) => api.get(`/properties/${id}`);
export const approveProperty = (id) => api.patch(`/properties/${id}/approve`);
export const updatePropertyStatus = (id, data) => api.patch(`/properties/${id}/status`, data);
export const featureProperty = (id) => api.patch(`/properties/${id}/feature`);
export const unfeatureProperty = (id) => api.patch(`/properties/${id}/unfeature`);

// Users
export const getUsers = (params) => api.get('/users', { params });
export const getSellers = (params) => getUsers({ ...(params || {}), role: 'seller' });
export const getCustomers = (params) => getUsers({ ...(params || {}), role: 'user' });
export const activateUser = (id) => api.patch(`/users/${id}/activate-seller`);
export const deactivateUser = (id) => api.patch(`/users/${id}/deactivate-seller`);
export const getActiveSellers = (params) => getUsers({ ...(params || {}), role: 'seller', is_activated: 1 });
export const getInactiveSellers = (params) => getUsers({ ...(params || {}), role: 'seller', is_activated: 0 });

export default api;
