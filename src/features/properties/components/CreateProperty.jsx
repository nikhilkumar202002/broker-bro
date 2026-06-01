import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createProperty,
  getAmenities,
  getCategories,
  getCountryStatesDistricts,
  getCountries,
  getFacilities,
  getPropertyTypes,
} from '../../../services/api';

const emptyFormData = () => ({
  name: '',
  description: '',
  location: '',
  address: '',
  property_category_ids: '',
  property_type_ids: '',
  property_type_value: '',
  country_id: '',
  state_id: '',
  district_id: '',
  property_images_files: [],
  property_videos_files: [],
  per_cent: '',
  total_cent: '',
  amount: '',
  bhk: '',
  no_of_bedrooms: '',
  no_of_bathrooms: '',
  no_of_kitchen: '',
  no_of_halls: '',
  sq_feet: '',
  facilities_ids: [],
  amenities_ids: [],
});

const inputClass = 'w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white';
const textareaClass = 'w-full h-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none';
const fileInputClass =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-blue-700';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

const getPayload = (response) => response?.data?.data ?? response?.data ?? response ?? {};

const getItemsPayload = (response, keys = []) => {
  const payload = getPayload(response);

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;

  return [];
};

const normalizeOptions = (items) =>
  (Array.isArray(items) ? items : []).map((item) => {
    if (item && typeof item === 'object') {
      const id = item.id ?? item._id ?? item.key ?? item.value ?? item.name;
      return {
        ...item,
        id,
        name: item.name ?? item.label ?? item.title ?? String(id ?? ''),
        value: item.value ?? '',
      };
    }

    return { id: item, name: String(item), value: '' };
  });

const getOptionName = (options, id) => {
  const found = options.find((option) => String(option.id) === String(id));
  return found?.name || id;
};

const formatFileSize = (size) => {
  if (!Number.isFinite(size)) return '';
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export default function CreateProperty({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState(emptyFormData());
  const [categories, setCategories] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [allDistricts, setAllDistricts] = useState([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [mediaInputKey, setMediaInputKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadLists = async () => {
      setListsLoading(true);
      setError(null);

      try {
        const [categoriesRes, typesRes, facilitiesRes, amenitiesRes, countriesRes] = await Promise.all([
          getCategories({ status: 'active', limit: 100 }),
          getPropertyTypes({ status: 'active', limit: 100 }),
          getFacilities({ status: 'active', limit: 100 }),
          getAmenities({ status: 'active', limit: 100 }),
          getCountries({ status: 'active', limit: 100 }),
        ]);

        if (!mounted) return;

        setCategories(normalizeOptions(getItemsPayload(categoriesRes, ['propertyCategories', 'categories'])));
        setPropertyTypes(normalizeOptions(getItemsPayload(typesRes, ['propertyTypes', 'types'])));
        setFacilities(normalizeOptions(getItemsPayload(facilitiesRes, ['facilities'])));
        setAmenities(normalizeOptions(getItemsPayload(amenitiesRes, ['amenities'])));
        setCountries(normalizeOptions(getItemsPayload(countriesRes, ['countries'])));
      } catch (e) {
        console.error('Failed to load property form options', e);
        if (!mounted) return;
        setError('Failed to load property form options.');
      } finally {
        if (mounted) setListsLoading(false);
      }
    };

    loadLists();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadStatesDistricts = async () => {
      if (!formData.country_id) {
        setStates([]);
        setAllDistricts([]);
        return;
      }

      try {
        setLocationsLoading(true);
        const response = await getCountryStatesDistricts(formData.country_id);
        if (!mounted) return;

        const payload = getPayload(response);
        const stateList = payload?.states ?? payload?.country?.states ?? [];
        const districtList = payload?.districts ?? payload?.country?.districts ?? [];

        setStates(normalizeOptions(stateList));
        setAllDistricts(normalizeOptions(districtList));
      } catch (e) {
        console.error('Failed to load states and districts', e);
        if (!mounted) return;
        setStates([]);
        setAllDistricts([]);
      } finally {
        if (mounted) setLocationsLoading(false);
      }
    };

    loadStatesDistricts();

    return () => {
      mounted = false;
    };
  }, [formData.country_id]);

  const imagePreviews = useMemo(
    () => formData.property_images_files.map((file) => ({
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
    })),
    [formData.property_images_files]
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [imagePreviews]);

  const videoPreviews = useMemo(
    () => formData.property_videos_files.map((file) => ({
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
    })),
    [formData.property_videos_files]
  );

  useEffect(() => {
    return () => {
      videoPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [videoPreviews]);

  const visibleDistricts = useMemo(() => {
    if (!formData.state_id) return allDistricts;

    const filtered = allDistricts.filter((district) => {
      const stateId = district.state_id ?? district.stateId ?? district.state?.id ?? district.state?._id;
      return !stateId || String(stateId) === String(formData.state_id);
    });

    return filtered.length > 0 ? filtered : allDistricts;
  }, [formData.state_id, allDistricts]);

  const selectedPropertyType = propertyTypes.find((type) => String(type.id) === String(formData.property_type_ids));
  const selectedTypeText = `${selectedPropertyType?.value || ''} ${selectedPropertyType?.name || ''} ${formData.property_type_value || ''}`.toLowerCase();
  const isPlotType = selectedTypeText.includes('plot') || selectedTypeText.includes('land');
  const isBuildingType =
    selectedTypeText.includes('building') ||
    selectedTypeText.includes('house') ||
    selectedTypeText.includes('flat') ||
    selectedTypeText.includes('apartment') ||
    selectedTypeText.includes('villa');
  const hidesLocationDetails = isPlotType || isBuildingType;

  const calculateAmount = (perCent, totalCent) => {
    const perCentNumber = Number(perCent);
    const totalCentNumber = Number(totalCent);
    if (!Number.isFinite(perCentNumber) || !Number.isFinite(totalCentNumber)) return '';
    if (perCentNumber <= 0 || totalCentNumber <= 0) return '';
    return String(perCentNumber * totalCentNumber);
  };

  const updateField = (key, value) => {
    setFormData((current) => {
      const next = { ...current, [key]: value };

      if (key === 'per_cent' || key === 'total_cent') {
        next.amount = calculateAmount(
          key === 'per_cent' ? value : next.per_cent,
          key === 'total_cent' ? value : next.total_cent
        );
      }

      return next;
    });
  };

  const handleSelect = (event, key) => {
    const value = event.target.value;

    if (key === 'property_type_ids') {
      const selected = propertyTypes.find((type) => String(type.id) === String(value));
      setFormData((current) => ({
        ...current,
        property_type_ids: value,
        property_type_value: selected?.value || selected?.name || '',
      }));
      return;
    }

    if (key === 'country_id') {
      setFormData((current) => ({ ...current, country_id: value, state_id: '', district_id: '' }));
      return;
    }

    if (key === 'state_id') {
      setFormData((current) => ({ ...current, state_id: value, district_id: '' }));
      return;
    }

    updateField(key, value);
  };

  const handleImagesChange = (event) => {
    updateField('property_images_files', Array.from(event.target.files || []));
  };

  const handleVideosChange = (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length > 2) {
      setError('You can upload up to 2 videos only.');
      event.target.value = '';
      return;
    }

    setError(null);
    updateField('property_videos_files', files);
  };

  const addSelectedOption = (event, key) => {
    const value = event.target.value;
    if (!value) return;

    setFormData((current) => {
      const selected = Array.isArray(current[key]) ? current[key].map(String) : [];
      if (selected.includes(value)) return current;
      return { ...current, [key]: [...selected, value] };
    });

    event.target.value = '';
  };

  const removeSelectedOption = (key, id) => {
    setFormData((current) => ({
      ...current,
      [key]: Array.isArray(current[key]) ? current[key].filter((item) => item !== id) : [],
    }));
  };

  const renderTextInput = (key, label, props = {}) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        {...props}
        value={formData[key]}
        onChange={(event) => updateField(key, event.target.value)}
        className={inputClass}
      />
    </div>
  );

  const renderSection = (title, children) => (
    <section className="border border-gray-100 rounded-xl p-4 bg-white">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </section>
  );

  const renderSelectedChips = (key, options) =>
    formData[key].length > 0 && (
      <div className="flex flex-wrap gap-2 mt-2">
        {formData[key].map((id) => (
          <span key={id} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            {getOptionName(options, id)}
            <button type="button" onClick={() => removeSelectedOption(key, id)} className="text-blue-500 hover:text-blue-700">
              x
            </button>
          </span>
        ))}
      </div>
    );

  const renderAssetCards = (items, type) =>
    items.length > 0 && (
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.url} className="overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
            <div className="aspect-video bg-gray-100">
              {type === 'image' ? (
                <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <video src={item.url} className="h-full w-full object-cover" controls />
              )}
            </div>
            <div className="min-w-0 px-2 py-1.5">
              <div className="truncate text-xs font-medium text-gray-700" title={item.name}>
                {item.name}
              </div>
              <div className="text-[11px] text-gray-400">{formatFileSize(item.size)}</div>
            </div>
          </div>
        ))}
      </div>
    );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.property_videos_files.length > 2) {
      setError('Maximum 2 videos allowed.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await createProperty({
        ...formData,
        property_category_ids: formData.property_category_ids ? [formData.property_category_ids] : [],
        property_type_ids: formData.property_type_ids ? [formData.property_type_ids] : [],
      });
      toast.success('Property created successfully');
      setFormData(emptyFormData());
      setMediaInputKey((current) => current + 1);
      onSuccess?.(response);
    } catch (e) {
      console.error('Create property failed', e);
      setError(e?.response?.data?.message || e?.message || 'Failed to create property.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(emptyFormData());
    setError(null);
    setMediaInputKey((current) => current + 1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add Property</h1>
        <p className="text-sm text-gray-500 mt-1">Fill the details below to create a property listing.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 space-y-4">
          {renderSection(
            'Property Basic Details',
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderTextInput('name', 'Name', { required: true, placeholder: 'Property name' })}
              {renderTextInput('location', 'Location', { placeholder: 'Landmark or coordinates' })}
              {renderTextInput('address', 'Address', { placeholder: 'Street address' })}
              <div className="md:col-span-3">
                <label className={labelClass}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  className={textareaClass}
                  placeholder="Short description"
                />
              </div>
            </div>
          )}

          {renderSection(
            'Property Classification',
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Category</label>
                <select
                  value={formData.property_category_ids}
                  onChange={(event) => handleSelect(event, 'property_category_ids')}
                  className={inputClass}
                  required
                >
                  <option value="">{listsLoading ? 'Loading categories...' : 'Select category'}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Property Type</label>
                <select
                  value={formData.property_type_ids}
                  onChange={(event) => handleSelect(event, 'property_type_ids')}
                  className={inputClass}
                  required
                >
                  <option value="">{listsLoading ? 'Loading types...' : 'Select type'}</option>
                  {propertyTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {!hidesLocationDetails &&
            renderSection(
              'Location Details',
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Country</label>
                  <select value={formData.country_id} onChange={(event) => handleSelect(event, 'country_id')} className={inputClass}>
                    <option value="">{listsLoading ? 'Loading countries...' : 'Select country'}</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <select
                    value={formData.state_id}
                    onChange={(event) => handleSelect(event, 'state_id')}
                    className={inputClass}
                    disabled={!formData.country_id}
                  >
                    <option value="">{locationsLoading ? 'Loading states...' : 'Select state'}</option>
                    {states.map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>District</label>
                  <select
                    value={formData.district_id}
                    onChange={(event) => handleSelect(event, 'district_id')}
                    className={inputClass}
                    disabled={!formData.country_id}
                  >
                    <option value="">{locationsLoading ? 'Loading districts...' : 'Select district'}</option>
                    {visibleDistricts.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

          {renderSection(
            isPlotType || isBuildingType ? 'Property Size & Pricing' : 'Pricing Details',
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {isPlotType && renderTextInput('per_cent', 'Per Cent', { type: 'number', min: '0' })}
              {isPlotType && renderTextInput('total_cent', 'Total Cent', { type: 'number', min: '0' })}
              {isBuildingType && renderTextInput('sq_feet', 'Sq Feet', { type: 'number', min: '0' })}
              {!isPlotType && !isBuildingType && renderTextInput('total_cent', 'Total Cent', { type: 'number', min: '0' })}
              {renderTextInput('amount', 'Amount', { type: 'number', min: '0', required: true })}
            </div>
          )}

          {!isPlotType &&
            renderSection(
              'Property Specifications',
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {renderTextInput('bhk', 'BHK', { type: 'number', min: '0' })}
                {renderTextInput('no_of_bedrooms', 'Bedrooms', { type: 'number', min: '0' })}
                {renderTextInput('no_of_bathrooms', 'Bathrooms', { type: 'number', min: '0' })}
                {renderTextInput('no_of_kitchen', 'Kitchen', { type: 'number', min: '0' })}
                {renderTextInput('no_of_halls', 'Halls', { type: 'number', min: '0' })}
                {!isBuildingType && renderTextInput('sq_feet', 'Sq Feet', { type: 'number', min: '0' })}
              </div>
            )}

          {renderSection(
            'Features & Facilities',
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Amenities</label>
                <select value="" onChange={(event) => addSelectedOption(event, 'amenities_ids')} className={inputClass}>
                  <option value="">{listsLoading ? 'Loading amenities...' : 'Select amenity'}</option>
                  {amenities.map((amenity) => (
                    <option key={amenity.id} value={amenity.id}>
                      {amenity.name}
                    </option>
                  ))}
                </select>
                {renderSelectedChips('amenities_ids', amenities)}
              </div>
              <div>
                <label className={labelClass}>Facilities</label>
                <select value="" onChange={(event) => addSelectedOption(event, 'facilities_ids')} className={inputClass}>
                  <option value="">{listsLoading ? 'Loading facilities...' : 'Select facility'}</option>
                  {facilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
                {renderSelectedChips('facilities_ids', facilities)}
              </div>
            </div>
          )}

          {renderSection(
            'Media Uploads',
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Property Images</label>
                <input
                  key={`images-${mediaInputKey}`}
                  type="file"
                  accept="image/*"
                  multiple
                  required
                  onChange={handleImagesChange}
                  className={fileInputClass}
                />
                <div className="text-xs text-gray-500 mt-1">{formData.property_images_files.length} file(s) selected</div>
                {renderAssetCards(imagePreviews, 'image')}
              </div>
              <div>
                <label className={labelClass}>Property Videos</label>
                <input
                  key={`videos-${mediaInputKey}`}
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideosChange}
                  className={fileInputClass}
                />
                <div className="text-xs text-gray-500 mt-1">{formData.property_videos_files.length} file(s) selected</div>
                {renderAssetCards(videoPreviews, 'video')}
              </div>
            </div>
          )}

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel || handleReset}
            className="w-full sm:w-auto px-5 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            disabled={submitting}
          >
            {onCancel ? 'Cancel' : 'Reset'}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Add Property'}
          </button>
        </div>
      </form>
    </div>
  );
}
