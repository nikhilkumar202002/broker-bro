import { useState, useEffect } from 'react';
import PropertyModal from '../../components/ui/PropertyModal';
import { getProperties, approveProperty } from '../../services/api';
import toast from 'react-hot-toast';
import { FiEdit, FiTrash2, FiEye } from 'react-icons/fi';

const initialProperties = [];

const statusStyles = {
  Approved: 'bg-green-100 text-green-700',
  Active: 'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Sold: 'bg-gray-100 text-gray-500',
};

export default function PropertiesList() {
  const [properties, setProperties] = useState(initialProperties);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [links, setLinks] = useState(null);
  const [updatingIds, setUpdatingIds] = useState([]);

  const categories = ['All', ...Array.from(new Set(properties.flatMap((p) => (p.categories || []).map(c => c.name))))];

  const filtered = properties.filter((p) => {
    const matchesSearch =
      String(p.name).toLowerCase().includes(search.toLowerCase()) ||
      String(p.id).toLowerCase().includes(search.toLowerCase());
    const primaryCategory = (p.categories && p.categories[0] && p.categories[0].name) || '';
    const matchesCategory = categoryFilter === 'All' || primaryCategory === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const fetchProperties = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProperties({ page });
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
      } else {
        items = root?.data ?? [];
        if (!Array.isArray(items)) items = [];
      }

      setProperties(items);
    } catch (e) {
      console.error('Failed to load properties', e);
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setEditingProperty(null);
    setModalOpen(true);
  };

  const openEdit = (property) => {
    setEditingProperty(property);
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  const handleApprove = async (property) => {
    const id = property.id;
    try {
      setUpdatingIds((s) => [...s, id]);
      const res = await approveProperty(id);
      const updated = res?.data?.data ?? res?.data ?? null;
      if (updated) {
        setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
        toast.success('Property approved');
      } else {
        // Fallback: mark as approved locally
        setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, is_approved: true, property_status: 'Approved' } : p)));
        toast.success('Property approved');
      }
    } catch (e) {
      console.error('Approve failed', e);
    } finally {
      setUpdatingIds((s) => s.filter((x) => x !== id));
    }
  };

  const handleSave = (formData) => {
    if (editingProperty) {
      setProperties((prev) =>
        prev.map((p) => (p.id === editingProperty.id ? { ...p, ...formData } : p))
      );
    } else {
      const newId = `#P-${String(properties.length + 1).padStart(3, '0')}`;
      setProperties((prev) => [{ id: newId, ...formData }, ...prev]);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Properties</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and view all your property listings.</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Property
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['ID', 'Name', 'Category', 'Type', 'Approval', 'Date', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">Loading properties...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-red-500">{error}</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">No properties found.</td>
                </tr>
              ) : (
                filtered.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-sm font-mono text-gray-400">#{property.id}</td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-900">{property.name}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{(property.categories && property.categories[0] && property.categories[0].name) || '-'}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{(property.property_types && property.property_types[0] && property.property_types[0].name) || '-'}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[property.property_status] || 'bg-gray-100 text-gray-500'}`}>
                          {property.property_status || (property.is_approved ? 'Approved' : 'Draft')}
                        </span>
                        {!(property.property_status === 'Approved' || property.property_status === 'Active' || property.is_approved) && (
                          <button
                            onClick={() => handleApprove(property)}
                            disabled={updatingIds.includes(property.id)}
                            className="text-sm px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
                          >
                            {updatingIds.includes(property.id) ? 'Approving...' : 'Approve'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-400">{property.created_at ? new Date(property.created_at).toLocaleDateString() : '-'}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(property)}
                          title="View"
                          className="p-2 rounded hover:bg-gray-100 text-gray-600"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(property)}
                          title="Edit"
                          className="p-2 rounded hover:bg-gray-100 text-blue-600"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(property.id)}
                          title="Delete"
                          className="p-2 rounded hover:bg-gray-100 text-red-500"
                        >
                          <FiTrash2 className="w-4 h-4" />
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
      {meta && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">Page {meta.current_page} of {meta.last_page} — {meta.total} total</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchProperties(meta.current_page - 1)}
              disabled={!meta.prev}
              className="px-3 py-1 text-sm rounded bg-gray-100 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => fetchProperties(meta.current_page + 1)}
              disabled={!meta.next}
              className="px-3 py-1 text-sm rounded bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <PropertyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editingProperty}
      />
    </div>
  );
}
