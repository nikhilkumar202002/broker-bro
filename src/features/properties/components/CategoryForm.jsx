import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createCategory, updateCategory } from '../../../services/api';

const getCategoryId = (category) => category?.id ?? category?._id;
const getCategoryImageUrl = (category) =>
  category?.image_full_url ?? category?.full_image_url ?? category?.image_url ?? category?.image_path;

const cleanPayload = (data) =>
  Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== null && value !== '')
  );

export default function CategoryForm({ onSuccess, onClose, initialData }) {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState('');
  const objectUrlRef = useRef('');

  // Populate form if we are editing an existing category
  useEffect(() => {
    if (initialData) {
      const timer = setTimeout(() => {
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
          status: initialData.status === true || initialData.status === 1 || initialData.status === '1' || String(initialData.status).toLowerCase() === 'active'
            ? 'active'
            : 'inactive',
          image: null, // Don't pre-populate the file input for security, let user upload a new one if needed
        });
        setImagePreview(getCategoryImageUrl(initialData) || '');
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [initialData]);

  useEffect(() => () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0] || null;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = '';
      }

      setFormData((prev) => ({ ...prev, [name]: file }));
      if (file) {
        objectUrlRef.current = URL.createObjectURL(file);
      }
      setImagePreview(objectUrlRef.current || getCategoryImageUrl(initialData) || '');
      return;
    }

    if (name === 'status') {
      setFormData((prev) => ({ ...prev, [name]: value }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Debug: check if token exists
    const token = localStorage.getItem('token');
    console.debug('[CategoryForm] Submitting:', { 
      isEditing, 
      hasToken: !!token, 
      formData: { ...formData, image: formData.image ? `File: ${formData.image.name}` : null }
    });

    // Check if we are updating (initialData exists) or creating
    const categoryId = getCategoryId(initialData);
    const payload = cleanPayload(formData);
    const apiPromise = initialData 
      ? updateCategory(categoryId, payload)
      : createCategory(payload);

    toast.promise(apiPromise, {
      loading: initialData ? 'Updating category...' : 'Saving category...',
      success: (res) => {
        console.debug('[CategoryForm] Success:', res);
        if (onSuccess) onSuccess(res);
        else navigate('/categories/property-category');
        return initialData ? 'Category updated successfully!' : 'Category created successfully!';
      },
      error: (err) => {
        console.error('[CategoryForm] Error:', err);
        return null;
      },
    }).catch((err) => {
      console.error('[CategoryForm] Caught error:', err);
    });
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
            <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">Category Name *</label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Agricultural Land"
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter a detailed description of this category..."
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
            <select
              name="status"
              id="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-semibold text-gray-900 mb-2">Image</label>
            <div className="relative">
              <input
                id="image"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            {imagePreview && (
              <div className="mt-3">
                <img
                  src={imagePreview}
                  alt={formData.name || 'Category'}
                  className="h-20 w-20 rounded-lg border border-gray-200 object-cover"
                />
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">Optional: PNG, JPG, GIF (Max 5MB)</p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3 sm:gap-4">
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              >
                Cancel
              </button>
            ) : (
              <Link
                to="/categories/property-category"
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              >
                Cancel
              </Link>
            )}
          <button
            type="submit"
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
          >
            {isEditing ? 'Update Category' : 'Save Category'}
          </button>
        </div>
      </form>
    </div>
  );
}
