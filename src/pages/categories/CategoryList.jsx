import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getCategories, deleteCategory } from '../../services/api';
import CategoryForm from '../../features/properties/components/CategoryForm';

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await getCategories();
      const outer = res?.data ?? res;
      const payload = outer?.data ?? outer;
      const items = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
      setCategories(items);
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

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
    fetchCategories(); // Refresh data table
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      const deletePromise = deleteCategory(id);

      toast.promise(deletePromise, {
        loading: 'Deleting category...',
        success: () => {
          setCategories((prev) => prev.filter((c) => c.id !== id));
          return 'Category deleted successfully!';
        },
        error: null, 
      }).catch(() => {});
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Manage property classification types.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
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
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">Loading categories...</td>
                </tr>
              ) : categories.length > 0 ? (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      {category.full_image_url || category.image_url ? (
                        <img
                          src={category.full_image_url ?? category.image_url}
                          alt={category.name}
                          className="w-10 h-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-400">N/A</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {category.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {(category.count ?? category.properties_count ?? 0)} <span className="text-gray-400 font-normal">listed</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const s = category.status;
                        const isActive = s === 1 || s === '1' || s === true || String(s).toLowerCase() === 'active';
                        const statusLabel = isActive ? 'Active' : 'Inactive';
                        const statusClass = isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-50 text-gray-700 border-gray-200';

                        return (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusClass}`}>
                            {statusLabel}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      {/* Fixed: Replaced <Link> with a button that triggers openEdit */}
                      <button onClick={() => openEdit(category)} className="text-amber-600 hover:text-amber-900 transition-colors" title="Edit">
                        <svg className="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(category.id)} className="text-red-600 hover:text-red-900 transition-colors" title="Delete">
                        <svg className="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}