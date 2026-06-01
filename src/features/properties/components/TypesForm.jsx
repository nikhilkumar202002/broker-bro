import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createPropertyType, updatePropertyType } from '../../../services/api';

export default function TypesForm({ onSuccess, onClose, initialData }) {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 1, // 1 active, 0 inactive
    image: null,
  });

  // Populate form if we are editing an existing property type
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

    // Debug: check if token exists
    const token = localStorage.getItem('token');
    console.debug('[TypesForm] Submitting:', { 
      isEditing, 
      hasToken: !!token, 
      formData: { ...formData, image: formData.image ? `File: ${formData.image.name}` : null }
    });

    // Check if we are updating (initialData exists) or creating
    const apiPromise = initialData 
      ? updatePropertyType(initialData.id, formData)
      : createPropertyType(formData);

    toast.promise(apiPromise, {
      loading: initialData ? 'Updating property type...' : 'Saving property type...',
      success: (res) => {
        console.debug('[TypesForm] Success:', res);
        if (onSuccess) onSuccess(res);
        else navigate('/categories/property-type');
        return initialData ? 'Property type updated successfully!' : 'Property type created successfully!';
      },
      error: (err) => {
        console.error('[TypesForm] Error:', err);
        return null;
      },
    }).catch((err) => {
      console.error('[TypesForm] Caught error:', err);
    });
  };

  const isEditing = Boolean(initialData);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {isEditing ? 'Edit Property Type' : 'Add New Property Type'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEditing ? 'Update the details for this property type.' : 'Create a new property type for your listings.'}
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">Property Type Name *</label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., House"
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
              placeholder="Enter a detailed description of this property type..."
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
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
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
                to="/categories/property-type"
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              >
                Cancel
              </Link>
            )}
          <button
            type="submit"
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
          >
            {isEditing ? 'Update Property Type' : 'Save Property Type'}
          </button>
        </div>
      </form>
    </div>
  );
}