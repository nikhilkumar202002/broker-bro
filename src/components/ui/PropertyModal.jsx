import { useEffect, useState } from 'react';

const emptyForm = {
  name: '',
  description: '',
  location: '',
  address: '',
  property_category_ids: '',
  property_type_ids: '',
  property_images_files: [],
  property_videos_files: [],
  per_cent: '',
  total_cent: '',
  amount: '',
  facilities_ids: '',
  amenities_ids: '',
};

const toCsv = (value) => {
  if (Array.isArray(value)) return value.join(', ');
  return value || '';
};

const toIdCsv = (items, fallback) => {
  if (Array.isArray(items) && items.length > 0) {
    return items.map((item) => item.id ?? item._id ?? item).join(', ');
  }

  return toCsv(fallback);
};

const toArray = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function PropertyModal({ isOpen, onClose, onSave, initialData }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (isOpen) {
      setForm(
        initialData
          ? {
              ...emptyForm,
              name: initialData.name || '',
              description: initialData.description || '',
              location: initialData.location || '',
              address: initialData.address || '',
              property_category_ids: toIdCsv(initialData.property_categories, initialData.property_category_ids),
              property_type_ids: toIdCsv(initialData.property_types, initialData.property_type_ids),
              per_cent: initialData.per_cent || '',
              total_cent: initialData.total_cent || '',
              amount: initialData.amount || '',
              facilities_ids: toIdCsv(initialData.facilities, initialData.facilities_ids),
              amenities_ids: toIdCsv(initialData.amenities, initialData.amenities_ids),
            }
          : { ...emptyForm }
      );
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value, files, type } = event.target;

    if (type === 'file') {
      setForm((prev) => ({ ...prev, [name]: Array.from(files || []) }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSave({
      ...form,
      property_category_ids: toArray(form.property_category_ids),
      property_type_ids: toArray(form.property_type_ids),
      facilities_ids: toArray(form.facilities_ids),
      amenities_ids: toArray(form.amenities_ids),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-3xl mx-4 bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {initialData ? 'Edit Plot Property' : 'Add Plot Property'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input name="name" required value={form.name} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea name="description" required rows={3} value={form.description} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <input name="location" required value={form.location} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <input name="address" required value={form.address} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Category IDs *</label>
              <input name="property_category_ids" required value={form.property_category_ids} onChange={handleChange} placeholder="id1, id2" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Type IDs *</label>
              <input name="property_type_ids" required value={form.property_type_ids} onChange={handleChange} placeholder="id1, id2" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Images *</label>
              <input name="property_images_files" type="file" required={!initialData} multiple accept="image/*" onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-blue-700" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Videos *</label>
              <input name="property_videos_files" type="file" required={!initialData} multiple accept="video/*" onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-blue-700" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Per Cent *</label>
              <input name="per_cent" type="number" required value={form.per_cent} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Cent *</label>
              <input name="total_cent" type="number" required value={form.total_cent} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
              <input name="amount" type="number" required value={form.amount} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facilities IDs</label>
              <input name="facilities_ids" value={form.facilities_ids} onChange={handleChange} placeholder="Optional: id1, id2" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amenities IDs</label>
              <input name="amenities_ids" value={form.amenities_ids} onChange={handleChange} placeholder="Optional: id1, id2" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              {initialData ? 'Save Changes' : 'Add Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
