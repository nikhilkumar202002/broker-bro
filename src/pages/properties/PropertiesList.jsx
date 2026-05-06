import { useState } from 'react';
import PropertyModal from '../../components/ui/PropertyModal';

const initialProperties = [
  { id: '#P-001', name: 'Sunrise Tech Park', category: 'Commercial', status: 'Active', price: '$2.5M', date: 'May 6, 2026' },
  { id: '#P-002', name: 'Downtown Retail Space', category: 'Plot + Building', status: 'Pending', price: '$850k', date: 'May 5, 2026' },
  { id: '#P-003', name: 'Westside Residential Plot', category: 'Plot', status: 'Active', price: '$120k', date: 'May 4, 2026' },
  { id: '#P-004', name: 'Lakeview Apartments', category: 'Rental', status: 'Sold', price: '$3.2k/mo', date: 'May 2, 2026' },
  { id: '#P-005', name: 'Greenfield Industrial Zone', category: 'Commercial', status: 'Active', price: '$5.1M', date: 'May 1, 2026' },
  { id: '#P-006', name: 'Harbor View Condos', category: 'Rental', status: 'Pending', price: '$2.8k/mo', date: 'Apr 29, 2026' },
  { id: '#P-007', name: 'North Hill Plots', category: 'Plot', status: 'Sold', price: '$95k', date: 'Apr 27, 2026' },
  { id: '#P-008', name: 'Central Business Tower', category: 'Plot + Building', status: 'Active', price: '$8.4M', date: 'Apr 25, 2026' },
];

const statusStyles = {
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

  const categories = ['All', ...Array.from(new Set(initialProperties.map((p) => p.category)))];

  const filtered = properties.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {['ID', 'Name', 'Category', 'Status', 'Price', 'Date', 'Actions'].map((h) => (
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">
                  No properties found.
                </td>
              </tr>
            ) : (
              filtered.map((property) => (
                <tr key={property.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 text-sm font-mono text-gray-400">{property.id}</td>
                  <td className="px-5 py-4 text-sm font-medium text-gray-900">{property.name}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{property.category}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[property.status]}`}>
                      {property.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-800">{property.price}</td>
                  <td className="px-5 py-4 text-sm text-gray-400">{property.date}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEdit(property)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(property.id)}
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

      <PropertyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editingProperty}
      />
    </div>
  );
}
