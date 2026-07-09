import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiX } from 'react-icons/fi';
import { createAdminUser, getAdmins } from '../../services/api';

const statusStyles = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-gray-100 text-gray-500',
};

const initialFormData = {
  name: '',
  email: '',
  password: '',
};

const getUsersPayload = (response) => {
  const payload = response?.data?.data ?? response?.data ?? {};

  if (Array.isArray(payload?.users)) {
    return {
      items: payload.users,
      pagination: payload.pagination ?? null,
    };
  }

  return {
    items: Array.isArray(payload) ? payload : [],
    pagination: null,
  };
};

const getCreatedUser = (response) => {
  const payload = response?.data?.data ?? response?.data ?? {};

  return payload?.user ?? payload;
};

export default function AdminUsers() {
  const [admins, setAdmins] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const fetchAdmins = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const res = await getAdmins({ page, limit: 10 });
      const { items, pagination } = getUsersPayload(res);

      setAdmins(items);
      setMeta(pagination);
    } catch {
      setError('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchAdmins(1);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const openModal = () => {
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (!saving) {
      setIsModalOpen(false);
      setFormData(initialFormData);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const res = await toast.promise(createAdminUser(formData), {
        loading: 'Creating admin user...',
        success: 'Admin user created successfully',
        error: 'Failed to create admin user',
      });
      const createdUser = getCreatedUser(res);

      if (createdUser?.id) {
        setAdmins((prev) => [createdUser, ...prev]);
      } else {
        fetchAdmins(meta?.page ?? 1);
      }

      setIsModalOpen(false);
      setFormData(initialFormData);
    } catch {
      // The API interceptor already shows the server error toast.
    } finally {
      setSaving(false);
    }
  };

  const filteredAdmins = admins.filter((admin) => {
    const searchTerm = search.toLowerCase();

    return (
      String(admin.name || '').toLowerCase().includes(searchTerm) ||
      String(admin.email || '').toLowerCase().includes(searchTerm) ||
      String(admin.mobile || admin.phoneNumber || '').includes(searchTerm) ||
      String(admin.id || '').includes(searchTerm)
    );
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this admin user?')) {
      setAdmins((prev) => prev.filter((admin) => admin.id !== id));
    }
  };

  const currentPage = meta?.page ?? 1;
  const perPage = meta?.limit ?? 10;
  const startIndex = (currentPage - 1) * perPage;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage users with admin access to the panel.</p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <FiPlus className="w-4 h-4" />
          Add Admin
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="Search by name, email, or mobile..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Sl No', 'Name', 'Email', 'Mobile', 'Role', 'Status', 'Actions'].map((heading) => (
                  <th key={heading} className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">Loading admin users...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-red-500">{error}</td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">No admin users found.</td>
                </tr>
              ) : (
                filteredAdmins.map((admin, index) => (
                  <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-gray-500">{startIndex + index + 1}</td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-900">{admin.name}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{admin.email}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{admin.mobile || admin.phoneNumber || '-'}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold">
                        {admin.role?.name || admin.role_id?.name || 'Admin'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${admin.is_activated === false ? statusStyles.Inactive : statusStyles.Active}`}>
                        {admin.is_activated === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button className="text-sm text-blue-600 hover:underline">Edit</button>
                        <button onClick={() => handleDelete(admin.id)} className="text-sm text-red-500 hover:underline">
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

      {meta && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">Page {meta.page} of {meta.totalPages} - {meta.total} total</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAdmins(meta.page - 1)}
              disabled={!meta.prevPageUrl}
              className="px-3 py-1 text-sm rounded bg-gray-100 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => fetchAdmins(meta.page + 1)}
              disabled={!meta.nextPageUrl}
              className="px-3 py-1 text-sm rounded bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Add Admin User</h2>
                <p className="text-sm text-gray-500 mt-1">Create a new admin account for panel access.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                title="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label htmlFor="admin-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  id="admin-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-wait"
                >
                  <FiPlus className="w-4 h-4" />
                  {saving ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
