import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createCategory, updateCategory } from '../../../services/api';

export default function CategoryForm({ onSuccess, onClose, initialData }) {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 1, // 1 active, 0 inactive
    image: null,
  });

  // Populate form if we are editing an existing category
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        status: initialData.status === true || initialData.status === 1 ? 1 : 0,
        image: null, // Don't pre-populate the file input for security, let user upload a new one if needed
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
      return;
    }

    if (name === 'status') {
      setFormData((prev) => ({ ...prev, [name]: Number(value) }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if we are updating (initialData exists) or creating
    const apiPromise = initialData 
      ? updateCategory(initialData.id, formData)
      : createCategory(formData);

    toast.promise(apiPromise, {
      loading: initialData ? 'Updating category...' : 'Saving category...',
      success: (res) => {
        if (onSuccess) onSuccess(res);
        else navigate('/categories');
        return initialData ? 'Category updated successfully!' : 'Category created successfully!';
      },
      error: null, // Let global interceptor handle errors
    }).catch(() => {});
  };

  const isEditing = Boolean(initialData);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {isEditing ? 'Edit Category' : 'Add New Category'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEditing ? 'Update the details for this classification.' : 'Create a new classification for your properties.'}
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Category Name</label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Agricultural Land"
              className="mt-1 block w-full rounded-lg border-gray-300 border px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border-gray-300 border px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              name="status"
              id="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border-gray-300 border px-3 py-2 text-gray-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            >
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">Image</label>
            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="mt-1 block w-full text-sm text-gray-900"
            />
            <p className="mt-2 text-xs text-gray-500">Optional: upload an image for this category.</p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
              >
                Cancel
              </button>
            ) : (
              <Link
                to="/categories"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
              >
                Cancel
              </Link>
            )}
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
          >
            {isEditing ? 'Update Category' : 'Save Category'}
          </button>
        </div>
      </form>
    </div>
  );
}