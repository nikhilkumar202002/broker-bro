import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { FiCrosshair, FiSearch, FiX } from 'react-icons/fi';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { getLocality, reverseGeocode, searchLocations } from '../services/geocoding';

const FALLBACK_POSITION = [22.5937, 78.9629];
const configuredPosition = [
  Number(import.meta.env.VITE_DEFAULT_MAP_LATITUDE),
  Number(import.meta.env.VITE_DEFAULT_MAP_LONGITUDE),
];
const DEFAULT_POSITION = configuredPosition.every(Number.isFinite) ? configuredPosition : FALLBACK_POSITION;

const propertyIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const MapController = ({ position, onSelect }) => {
  const map = useMap();
  useMapEvents({ click: ({ latlng }) => onSelect(latlng.lat, latlng.lng) });

  useEffect(() => {
    const frame = requestAnimationFrame(() => map.invalidateSize());
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [map]);

  useEffect(() => {
    if (position) map.setView(position, 17, { animate: true });
  }, [map, position]);
  return null;
};

const formatCoordinate = (value) => Number(value).toFixed(6);

export default function PropertyLocationMap({ latitude, longitude, onLocationChange, onResolvingChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [error, setError] = useState('');
  const reverseController = useRef(null);
  const searchController = useRef(null);
  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasPosition = latitude !== '' && longitude !== '' && Number.isFinite(lat) && Number.isFinite(lng);
  const position = useMemo(() => (hasPosition ? [lat, lng] : null), [hasPosition, lat, lng]);

  useEffect(() => () => {
    reverseController.current?.abort();
    searchController.current?.abort();
  }, []);

  const setResolvingState = useCallback((value) => {
    setResolving(value);
    onResolvingChange?.(value);
  }, [onResolvingChange]);

  const selectCoordinates = useCallback(async (selectedLat, selectedLng) => {
    const nextLatitude = formatCoordinate(selectedLat);
    const nextLongitude = formatCoordinate(selectedLng);
    reverseController.current?.abort();
    const controller = new AbortController();
    reverseController.current = controller;
    setError('');
    setResolvingState(true);
    onLocationChange({ latitude: nextLatitude, longitude: nextLongitude });

    try {
      const result = await reverseGeocode(nextLatitude, nextLongitude, controller.signal);
      onLocationChange({
        latitude: nextLatitude,
        longitude: nextLongitude,
        address: result.display_name || '',
        location: getLocality(result.address),
      });
    } catch (requestError) {
      if (requestError.name !== 'AbortError') setError('Coordinates selected, but the address could not be resolved. You can enter it manually.');
    } finally {
      if (reverseController.current === controller) {
        setResolvingState(false);
        reverseController.current = null;
      }
    }
  }, [onLocationChange, setResolvingState]);

  const handleSearch = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    setSearching(true);
    setSearchAttempted(true);
    setError('');
    setResults([]);
    try {
      setResults(await searchLocations(trimmedQuery, controller.signal));
    } catch (requestError) {
      if (requestError.name !== 'AbortError') setError('Address search failed. Please try again.');
    } finally {
      if (searchController.current === controller) setSearching(false);
    }
  };

  const chooseResult = (result) => {
    reverseController.current?.abort();
    setResolvingState(false);
    const resultLatitude = formatCoordinate(result.lat);
    const resultLongitude = formatCoordinate(result.lon);
    onLocationChange({
      latitude: resultLatitude,
      longitude: resultLongitude,
      address: result.display_name || '',
      location: getLocality(result.address),
    });
    setQuery(result.display_name || '');
    setResults([]);
    setError('');
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Your browser does not support location access.');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        selectCoordinates(coords.latitude, coords.longitude);
      },
      (geoError) => {
        setLocating(false);
        setError(geoError.code === 1 ? 'Location permission was denied. You can still select a point on the map.' : 'Your current location could not be determined.');
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative" role="search">
        <label htmlFor="property-location-search" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Location search</label>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <FiSearch aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input id="property-location-search" value={query} onChange={(event) => { setQuery(event.target.value); setSearchAttempted(false); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); handleSearch(); } }} placeholder="Search city, locality, landmark, or address" className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-9 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            {query && <button type="button" aria-label="Clear location search" onClick={() => { setQuery(''); setResults([]); setSearchAttempted(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-700"><FiX /></button>}
          </div>
          <button type="button" onClick={handleSearch} disabled={searching || !query.trim()} className="rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{searching ? 'Searching…' : 'Search'}</button>
        </div>
        {(results.length > 0 || (searchAttempted && !searching && !error)) && (
          <div className="absolute z-[1001] mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {results.length > 0 ? results.map((result) => (
              <button key={`${result.place_id}-${result.lat}`} type="button" onClick={() => chooseResult(result)} className="block w-full border-b border-gray-100 px-3 py-2.5 text-left text-sm text-gray-700 last:border-0 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none">{result.display_name}</button>
            )) : <p className="px-3 py-3 text-sm text-gray-500">No matching places found.</p>}
          </div>
        )}
      </div>

      <button type="button" onClick={useCurrentLocation} disabled={locating} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"><FiCrosshair aria-hidden="true" />{locating ? 'Finding your location…' : 'Use my current location'}</button>
      <div className="h-[340px] overflow-hidden rounded-xl border border-gray-200 bg-gray-100 lg:h-[460px]">
        <MapContainer center={position || DEFAULT_POSITION} zoom={position ? 17 : 5} zoomControl className="h-full w-full">
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapController position={position} onSelect={selectCoordinates} />
          {position && <Marker position={position} icon={propertyIcon} draggable eventHandlers={{ dragend: (event) => { const point = event.target.getLatLng(); selectCoordinates(point.lat, point.lng); } }} />}
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500">Click the map or drag the marker to select the exact property location.</p>
      {resolving && <p role="status" className="text-sm text-blue-600">Resolving selected address…</p>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
