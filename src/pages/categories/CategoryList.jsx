import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function CategoryList() {
  // 1. State for categories and loading status
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Fetch categories on load
  useEffect(() => {
    const fetchCategories = async () => {
      try {

        setTimeout(() => {
          setCategories([
            { id: 1, name: 'Plot', description: 'Empty land available for construction', count: 45, status: 'Active' },
            { id: 2, name: 'Commercial', description: 'Office spaces, retail shops, and warehouses', count: 12, status: 'Active' },
            { id: 3, name: 'Plot + Building', description: 'Land with existing structures', count: 8, status: 'Active' },
            { id: 4, name: 'Rental', description: 'Residential and commercial properties for rent', count: 156, status: 'Active' },
          ]);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        setIsLoading(false);
        // Error toast is already handled by api.js interceptor!
      }
    };

    fetchCategories();
  }, []);

  // 3. Delete handler
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      const deletePromise = api.delete(`/categories/${id}`);
      
      toast.promise(deletePromise, {
        loading: 'Deleting category...',
        success: () => {
          setCategories(categories.filter(c => c.id !== id));
          return 'Category deleted successfully!';
        },
        error: null, // Let the global interceptor handle the error toast
      }).catch(() => {}); // Catch to prevent console warnings
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
        <Link 
          to="/categories/create"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </Link>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category Name</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Properties</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">Loading categories...</td>
                </tr>
              ) : categories.length > 0 ? (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {category.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {category.count} <span className="text-gray-400 font-normal">listed</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${category.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                      >
                        {category.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <Link to={`/categories/edit/${category.id}`} className="text-amber-600 hover:text-amber-900 transition-colors" title="Edit">
                        <svg className="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </Link>
                      <button onClick={() => handleDelete(category.id)} className="text-red-600 hover:text-red-900 transition-colors" title="Delete">
                        <svg className="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}