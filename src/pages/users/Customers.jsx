import { useState } from 'react';

// Simulated initial data for Customers (mocked API response)
const initialCustomers = [
  {
    id: 101,
    name: "Alice Smith",
    email: "alice@example.com",
    mobile: "7012345678",
    role: { name: "Customer", value: "customer" },
    is_activated: true
  },
  {
    id: 102,
    name: "Bob Johnson",
    email: "bob.j@example.com",
    mobile: "7098765432",
    role: { name: "Customer", value: "customer" },
    is_activated: false
  }
];
const statusStyles = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-gray-100 text-gray-500',
};

export default function Customers() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState('');

  // Filtering logic based on Name, Email, or Mobile
  const filteredCustomers = customers.filter((c) => {
    const searchTerm = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm) ||
      c.mobile.includes(searchTerm) ||
      String(c.id).includes(searchTerm)
    );
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and view all registered customers in the system.</p>
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
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-sm font-mono text-gray-400">#{customer.id}</td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-900">{customer.name}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{customer.email}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{customer.mobile}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold">
                        {customer.role.name}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${customer.is_activated ? statusStyles.Active : statusStyles.Inactive}`}>
                        {customer.is_activated ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button className="text-sm text-blue-600 hover:underline">
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
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