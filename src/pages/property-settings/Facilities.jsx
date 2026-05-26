import { useEffect, useState } from 'react';
import { getFacilities } from '../../services/api';

const getFacilitiesPayload = (response) => {
  const payload = response?.data?.data ?? response?.data ?? {};

  return {
    items: Array.isArray(payload?.facilities) ? payload.facilities : [],
    pagination: payload?.pagination ?? null,
  };
};

export default function Facilities() {
  const [facilities, setFacilities] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchFacilities = async (pageNumber = 1) => {
    setLoading(true);
    setError('');

    try {
      const response = await getFacilities({ page: pageNumber, limit: 10 });
      const { items, pagination: paginationData } = getFacilitiesPayload(response);

      setFacilities(items);
      setPagination(paginationData);
      setPage(paginationData?.page ?? pageNumber);
    } catch (err) {
      setError('Failed to load facilities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities(1);
  }, []);

  const currentPage = pagination?.page ?? page;
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? facilities.length;
  const perPage = pagination?.limit ?? 10;
  const startIndex = (currentPage - 1) * perPage;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Facilities</h1>
          <p className="text-sm text-gray-500 mt-1">Manage nearby facilities available for property listings.</p>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-500">Loading facilities...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-red-500">{error}</td>
                </tr>
              ) : facilities.length > 0 ? (
                facilities.map((facility, index) => (
                  <tr key={facility.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">{startIndex + index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{facility.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 break-words">{facility.description || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-500">No facilities found.</td>
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
              onClick={() => fetchFacilities(currentPage - 1)}
              disabled={loading || currentPage <= 1}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              onClick={() => fetchFacilities(currentPage + 1)}
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
