import { useState, useEffect } from 'react';
import { getSellers, activateUser, deactivateUser } from '../../services/api';

// Initial empty list; will fetch from API
const initialSellers = [];

const statusStyles = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-gray-100 text-gray-500',
};

export default function Sellers() {
  const [sellers, setSellers] = useState(initialSellers);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [links, setLinks] = useState(null);

  const fetchSellers = async (page = 1) => {
    let mounted = true;
    setLoading(true);
    setError(null);
    try {
      const res = await getSellers({ page });
      if (!mounted) return;

      // Normalize response shapes:
      // 1) { data: { data: [...], meta: {...}, links: {...} } }
      // 2) { data: [...] }
      // 3) [...] or other
      const root = res?.data;
      let items = [];
      if (root && root.data && Array.isArray(root.data.data)) {
        items = root.data.data;
        setMeta(root.data.meta || null);
        setLinks(root.data.links || null);
      } else if (root && Array.isArray(root.data)) {
        items = root.data;
        setMeta(null);
        setLinks(null);
      } else if (Array.isArray(root)) {
        items = root;
        setMeta(null);
        setLinks(null);
      } else if (root && Array.isArray(root.data?.data)) {
        items = root.data.data;
        setMeta(root.data.meta || null);
        setLinks(root.data.links || null);
      } else {
        // fallback: try common nested path
        items = root?.data ?? [];
        if (Array.isArray(items)) {
          setMeta(null);
          setLinks(null);
        } else {
          items = [];
        }
      }

      setSellers(items);
    } catch (err) {
      console.error('Failed to load sellers', err);
      setError('Failed to load sellers');
    } finally {
      if (mounted) setLoading(false);
    }
    return () => { mounted = false; };
  };

  useEffect(() => {
    fetchSellers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleActive = async (id, currentlyActive) => {
    // mark row updating
    setSellers((prev) => prev.map(s => s.id === id ? { ...s, updating: true } : s));
    try {
      if (currentlyActive) {
        await deactivateUser(id);
      } else {
        await activateUser(id);
      }

      setSellers((prev) => prev.map(s => s.id === id ? { ...s, is_activated: !currentlyActive, updating: false } : s));
    } catch (e) {
      console.error('Toggle active failed', e);
      setSellers((prev) => prev.map(s => s.id === id ? { ...s, updating: false } : s));
      setError('Failed to update user status');
    }
  };

  // Filtering logic based on Name, Email, or Mobile
  const filteredSellers = sellers.filter((s) => {
    const searchTerm = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(searchTerm) ||
      s.email.toLowerCase().includes(searchTerm) ||
      s.mobile.includes(searchTerm) ||
      String(s.id).includes(searchTerm)
    );
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this seller?')) {
      setSellers((prev) => prev.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sellers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and view all registered sellers in the system.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="Search by name, email, or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['ID', 'Name', 'Email', 'Mobile', 'Role', 'Status', 'Active', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-gray-400">
                    Loading sellers...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-red-500">
                    {error}
                  </td>
                </tr>
              ) : filteredSellers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-gray-400">
                    No sellers found.
                  </td>
                </tr>
              ) : (
                filteredSellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-sm font-mono text-gray-400">#{seller.id}</td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-900">{seller.name}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{seller.email}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{seller.mobile}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold">
                        {seller.role.name}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${seller.is_activated ? statusStyles.Active : statusStyles.Inactive}`}>
                        {seller.is_activated ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleActive(seller.id, !!seller.is_activated)}
                        disabled={seller.updating}
                        className={`px-3 py-1 text-sm rounded-lg font-medium ${seller.updating ? 'opacity-50 cursor-wait' : seller.is_activated ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      >
                        {seller.updating ? 'Saving...' : (seller.is_activated ? 'Deactivate' : 'Activate')}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button className="text-sm text-blue-600 hover:underline">
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(seller.id)}
                          className="text-sm text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Pagination controls */}
      {meta && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">Page {meta.current_page} of {meta.last_page} — {meta.total} total</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchSellers(meta.current_page - 1)}
              disabled={!meta.prev}
              className="px-3 py-1 text-sm rounded bg-gray-100 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => fetchSellers(meta.current_page + 1)}
              disabled={!meta.next}
              className="px-3 py-1 text-sm rounded bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}