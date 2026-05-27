import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getCategories, deleteCategory, updateCategory } from '../../services/api';
import CategoryForm from '../../features/properties/components/CategoryForm';

const getCategoriesPayload = (response) => {
  const payload = response?.data?.data ?? response?.data ?? {};

  if (Array.isArray(payload?.propertyCategories)) {
    return {
      items: payload.propertyCategories,
      pagination: payload.pagination ?? null,
    };
  }

  if (Array.isArray(payload?.categories)) {
    return {
      items: payload.categories,
      pagination: payload.pagination ?? null,
    };
  }

  if (Array.isArray(payload)) {
    return { items: payload, pagination: null };
  }

  if (Array.isArray(payload?.data)) {
    return { items: payload.data, pagination: payload.pagination ?? null };
  }

  return { items: [], pagination: null };
};

const getCategoryId = (category) => category?.id ?? category?._id;

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchCategories = async (page = 1, filter = statusFilter) => {
    try {
      setIsLoading(true);
      const params = { page, limit: 10 };
      if (filter !== 'all') {
        params.status = filter;
      }
      const res = await getCategories(params);
      const { items, pagination: paginationData } = getCategoriesPayload(res);
      setCategories(items);
      setPagination(paginationData);
    } catch {
      // Error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  };

  // Background refresh without loader
  const backgroundRefreshCategories = async () => {
    try {
      const params = { page: pagination?.page ?? 1, limit: 10 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const res = await getCategories(params);
      const { items, pagination: paginationData } = getCategoriesPayload(res);
      setCategories(items);
      setPagination(paginationData);
    } catch {
      // Silent error handling - don't show loader
    }
  };

  useEffect(() => {
    const initialFetch = setTimeout(() => {
      fetchCategories(1);
    }, 0);
    
    // Set up auto-refresh every 5 seconds
    const interval = setInterval(() => {
      backgroundRefreshCategories();
    }, 5000);

    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const openCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSuccess = () => {
    closeModal();
    fetchCategories(pagination?.page ?? 1); // Refresh data table
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      const deletePromise = deleteCategory(id);

      toast.promise(deletePromise, {
        loading: 'Deleting category...',
        success: () => {
          setCategories((prev) => prev.filter((c) => getCategoryId(c) !== id));
          return 'Category deleted successfully!';
        },
        error: null, 
      }).catch(() => {});
    }
  };

  const handleToggleStatus = (category) => {
    const isCurrentlyActive = category.status === true || category.status === 1 || category.status === '1' || String(category.status).toLowerCase() === 'active';
    const togglePromise = isCurrentlyActive 
      ? updateCategory(getCategoryId(category), { status: 'inactive' })
      : updateCategory(getCategoryId(category), { status: 'active' });

    toast.promise(togglePromise, {
      loading: isCurrentlyActive ? 'Deactivating...' : 'Activating...',
      success: () => {
        // Update the category in state
        setCategories((prev) =>
          prev.map((c) =>
            getCategoryId(c) === getCategoryId(category)
              ? { ...c, status: isCurrentlyActive ? 'inactive' : 'active' }
              : c
          )
        );
        if (statusFilter !== 'all') {
          backgroundRefreshCategories();
        }
        return isCurrentlyActive ? 'Category deactivated!' : 'Category activated!';
      },
      error: null,
    }).catch(() => {});
  };

  const currentPage = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? categories.length;
  const perPage = pagination?.limit ?? 10;
  const startIndex = (currentPage - 1) * perPage;
  const filters = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Property Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Manage property category classifications.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
      </div>

      <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              statusFilter === filter.value
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-2xl mx-4">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="px-4 py-3 border-b border-gray-100 flex justify-end">
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <CategoryForm 
                  onSuccess={handleSuccess} 
                  onClose={closeModal} 
                  initialData={editingCategory} 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sl No</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category Name</th>
                <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Image</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Properties</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">Loading categories...</td>
                </tr>
              ) : categories.length > 0 ? (
                categories.map((category, index) => (
                  <tr key={getCategoryId(category)} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">{startIndex + index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      {category.image_full_url || category.full_image_url || category.image_url ? (
                        <img
                          src={category.image_full_url ?? category.full_image_url ?? category.image_url}
                          alt={category.name}
                          className="w-10 h-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-400">N/A</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 break-words">
                      {category.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {(category.count ?? category.properties_count ?? 0)} <span className="text-gray-400 font-normal">listed</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const s = category.status;
                        const hasStatus = typeof s !== 'undefined' && s !== null;
                        const isActive = s === 1 || s === '1' || s === true || String(s).toLowerCase() === 'active';
                        const statusLabel = isActive ? 'Active' : 'Inactive';
                        const statusClass = isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';

                        if (!hasStatus) {
                          return <span className="text-sm text-gray-400">-</span>;
                        }

                        return (
                          <button
                            onClick={() => handleToggleStatus(category)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${statusClass}`}
                            title={`Click to ${isActive ? 'deactivate' : 'activate'}`}
                          >
                            {statusLabel}
                          </button>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      {/* Fixed: Replaced <Link> with a button that triggers openEdit */}
                      <button onClick={() => openEdit(category)} className="text-amber-600 hover:text-amber-900 transition-colors" title="Edit">
                        <svg className="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(getCategoryId(category))} className="text-red-600 hover:text-red-900 transition-colors" title="Delete">
                        <svg className="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">Page {currentPage} of {totalPages} - {total} total</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchCategories(currentPage - 1)}
              disabled={!pagination.prevPageUrl}
              className="px-3 py-1 text-sm rounded bg-gray-100 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => fetchCategories(currentPage + 1)}
              disabled={!pagination.nextPageUrl}
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
