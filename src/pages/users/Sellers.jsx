import { useState } from 'react';

// Simulated initial data from your API response structure
const initialSellers = [
  {
    id: 3,
    name: "Dileepan",
    email: "dileepan@gmail.com",
    mobile: "7894561230",
    role: { name: "Seller", value: "seller" },
    is_activated: false
  },
  // Add more mock data if needed for testing
  {
    id: 4,
    name: "Jane Doe",
    email: "jane@example.com",
    mobile: "9876543210",
    role: { name: "Seller", value: "seller" },
    is_activated: true
  }
];

const statusStyles = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-gray-100 text-gray-500',
};

export default function Sellers() {
  const [sellers, setSellers] = useState(initialSellers);
  const [search, setSearch] = useState('');

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
        <button
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Seller
        </button>
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
                {['ID', 'Name', 'Email', 'Mobile', 'Role', 'Status', 'Actions'].map((h) => (
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
              {filteredSellers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">
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
    </div>
  );
}