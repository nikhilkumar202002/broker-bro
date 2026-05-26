import { useEffect, useState } from 'react';
import { getAmenities } from '../../services/api';

const statusStyles = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-gray-50 text-gray-700 border-gray-200',
};

const getAmenitiesPayload = (response) => {
  const payload = response?.data?.data ?? response?.data ?? {};

  return {
    items: Array.isArray(payload?.amenities) ? payload.amenities : [],
    pagination: payload?.pagination ?? null,
  };
};

const formatDate = (value) => {
  if (!value) return '-';

  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function Amenties() {
  const [amenities, setAmenities] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAmenities = async (pageNumber = 1) => {
    setLoading(true);
    setError('');

    try {
      const response = await getAmenities({ page: pageNumber, limit: 10 });
      const { items, pagination: paginationData } = getAmenitiesPayload(response);

      setAmenities(items);
      setPagination(paginationData);
      setPage(paginationData?.page ?? pageNumber);
    } catch (err) {
      setError('Failed to load amenities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmenities(1);
  }, []);

  const currentPage = pagination?.page ?? page;
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? amenities.length;
  const perPage = pagination?.limit ?? 10;
  const startIndex = (currentPage - 1) * perPage;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Amenities</h1>
          <p className="text-sm text-gray-500 mt-1">Manage property amenities available for listings.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sl No</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">Loading amenities...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-red-500">{error}</td>
                </tr>
              ) : amenities.length > 0 ? (
                amenities.map((amenity, index) => {
                  const status = String(amenity.status || 'inactive').toLowerCase();

                  return (
                    <tr key={amenity.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">{startIndex + index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{amenity.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 break-words">{amenity.description || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status] || statusStyles.inactive}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(amenity.createdAt)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">No amenities found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages} - {total} total
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAmenities(currentPage - 1)}
              disabled={loading || currentPage <= 1}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              onClick={() => fetchAmenities(currentPage + 1)}
              disabled={loading || currentPage >= totalPages}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
