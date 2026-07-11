const NOMINATIM_BASE_URL = (import.meta.env.VITE_NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org').replace(/\/$/, '');

const request = async (path, params, signal) => {
  const url = new URL(`${NOMINATIM_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) throw new Error(`Location service returned ${response.status}.`);
  return response.json();
};

export const getLocality = (address = {}) =>
  address.city ||
  address.town ||
  address.village ||
  address.municipality ||
  address.county ||
  address.state_district ||
  address.state ||
  '';

export const searchLocations = (query, signal) => {
  const params = {
    format: 'jsonv2',
    addressdetails: '1',
    limit: '5',
    q: query,
  };

  if (import.meta.env.VITE_NOMINATIM_COUNTRYCODES) {
    params.countrycodes = import.meta.env.VITE_NOMINATIM_COUNTRYCODES;
  }

  return request('/search', params, signal);
};

export const reverseGeocode = (latitude, longitude, signal) =>
  request(
    '/reverse',
    { format: 'jsonv2', addressdetails: '1', lat: String(latitude), lon: String(longitude) },
    signal
  );
