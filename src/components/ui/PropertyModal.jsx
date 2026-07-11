import { useEffect, useRef, useState } from 'react';
import PropertyLocationMap from '../PropertyLocationMap';

const emptyForm = {
  name: '', description: '', location: '', address: '', latitude: '', longitude: '',
  property_category_ids: '', property_type_ids: '', property_images_files: [], property_videos_files: [],
  per_cent: '', total_cent: '', amount: '', is_rented: '0', facilities_ids: '', amenities_ids: '',
};

const toCsv = (value) => Array.isArray(value) ? value.join(', ') : value || '';
const toIdCsv = (items, fallback) => Array.isArray(items) && items.length
  ? items.map((item) => item.id ?? item._id ?? item).join(', ')
  : toCsv(fallback);
const toFirstId = (items, fallback) => {
  if (Array.isArray(items) && items.length) return String(items[0]?.id ?? items[0]?._id ?? items[0] ?? '');
  return String(Array.isArray(fallback) ? fallback[0] ?? '' : fallback || '');
};
const toArray = (value) => String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
const getOptionId = (option) => option?.id ?? option?._id ?? option?.value ?? option?.name;
const isRentedValue = (value) => value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';
const getCoordinate = (data, primary, fallback) => {
  const value = data?.[primary] ?? data?.[fallback] ?? '';
  return value === null ? '' : String(value);
};

const inputClass = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500';
const cardClass = 'rounded-xl border border-gray-200 bg-white p-4 sm:p-5';

const SectionTitle = ({ children, description }) => (
  <div className="mb-4"><h3 className="font-semibold text-gray-900">{children}</h3>{description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}</div>
);

export default function PropertyModal({
  isOpen, onClose, onSave, initialData, categoryOptions = [], typeOptions = [], amenitiesOptions = [], facilitiesOptions = [],
}) {
  const [form, setForm] = useState(emptyForm);
  const [coordinateError, setCoordinateError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = setTimeout(() => {
      setForm(initialData ? {
        ...emptyForm,
        name: initialData.name || '', description: initialData.description || '', location: initialData.location || '', address: initialData.address || '',
        latitude: getCoordinate(initialData, 'latitude', 'lat'), longitude: getCoordinate(initialData, 'longitude', 'lng'),
        property_category_ids: toFirstId(initialData.property_categories, initialData.property_category_ids),
        property_type_ids: toFirstId(initialData.property_types, initialData.property_type_ids),
        per_cent: initialData.per_cent || '', total_cent: initialData.total_cent || '',
        amount: initialData.amount_per_month || initialData.amount || '',
        is_rented: isRentedValue(initialData.is_rented) ? '1' : '0',
        facilities_ids: toIdCsv(initialData.facilities, initialData.facilities_ids),
        amenities_ids: toIdCsv(initialData.amenities, initialData.amenities_ids),
      } : { ...emptyForm });
      setCoordinateError('');
      setSaveError('');
    }, 0);
    const frame = requestAnimationFrame(() => nameInputRef.current?.focus());
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen || isSaving) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const handleChange = ({ target }) => {
    const { name, value, files, type, selectedOptions, multiple } = target;
    if (type === 'file') return setForm((previous) => ({ ...previous, [name]: Array.from(files || []) }));
    if (multiple) return setForm((previous) => ({ ...previous, [name]: Array.from(selectedOptions).map((option) => option.value) }));
    setForm((previous) => ({ ...previous, [name]: value, ...(name === 'is_rented' && value === '1' ? { property_type_ids: '', per_cent: '', total_cent: '' } : {}) }));
  };

  const handleMapLocationChange = ({ latitude, longitude, address, location }) => {
    setCoordinateError('');
    setForm((previous) => ({
      ...previous,
      latitude: String(latitude ?? ''), longitude: String(longitude ?? ''),
      address: address ?? previous.address, location: location ?? previous.location,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSaving || isResolving) return;
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (form.latitude === '' || form.longitude === '' || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setCoordinateError('Select a valid property location on the map before saving.');
      return;
    }
    const { amount, property_type_ids: propertyTypeIds, per_cent: perCent, total_cent: totalCent, ...restForm } = form;
    const isRental = String(form.is_rented) === '1';
    setIsSaving(true);
    setSaveError('');
    try {
      await onSave({
        ...restForm, latitude, longitude, is_rented: isRental,
        ...(isRental ? { amount_per_month: amount } : { amount }),
        property_category_ids: toArray(form.property_category_ids),
        ...(!isRental ? { property_type_ids: toArray(propertyTypeIds), per_cent: perCent, total_cent: totalCent } : {}),
        facilities_ids: toArray(form.facilities_ids), amenities_ids: toArray(form.amenities_ids),
      });
    } catch (error) {
      setSaveError(error?.response?.data?.message || error?.message || 'The property could not be saved. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderOptions = (options) => options.map((option) => {
    const id = String(getOptionId(option));
    return <option key={id} value={id}>{option.name}</option>;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="property-modal-title">
      <button type="button" aria-label="Close property editor" className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-sm" onClick={isSaving ? undefined : onClose} />
      <div className="relative z-10 flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-gray-50 shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-4 sm:px-6">
          <div><h2 id="property-modal-title" className="text-lg font-semibold text-gray-900">{initialData ? 'Edit Plot Property' : 'Add Plot Property'}</h2><p className="text-xs text-gray-500">Add listing details and pinpoint the exact property location.</p></div>
          <button type="button" aria-label="Close" disabled={isSaving} onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[minmax(0,55fr)_minmax(0,45fr)] lg:items-start">
            <section className={`${cardClass} lg:col-start-1 lg:row-start-1`}>
              <SectionTitle description="Core information shown to prospective buyers or tenants.">Listing Details</SectionTitle>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <fieldset className="sm:col-span-2"><legend className={labelClass}>Listing Type *</legend><div className="grid grid-cols-2 gap-3">{[{ value: '0', label: 'For Selling' }, { value: '1', label: 'For Rental' }].map((option) => <label key={option.value} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium ${form.is_rented === option.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700'}`}><input type="radio" name="is_rented" value={option.value} checked={form.is_rented === option.value} onChange={handleChange} />{option.label}</label>)}</div></fieldset>
                <div className="sm:col-span-2"><label htmlFor="property-name" className={labelClass}>Name *</label><input ref={nameInputRef} id="property-name" name="name" required value={form.name} onChange={handleChange} className={inputClass} /></div>
                <div className="sm:col-span-2"><label htmlFor="property-description" className={labelClass}>Description *</label><textarea id="property-description" name="description" required rows={4} value={form.description} onChange={handleChange} className={`${inputClass} resize-none`} /></div>
                <div><label htmlFor="property-category" className={labelClass}>Property Category *</label><select id="property-category" name="property_category_ids" required value={form.property_category_ids} onChange={handleChange} className={inputClass}><option value="">Select category</option>{renderOptions(categoryOptions)}</select></div>
                {form.is_rented !== '1' && <div><label htmlFor="property-type" className={labelClass}>Property Type *</label><select id="property-type" name="property_type_ids" required value={form.property_type_ids} onChange={handleChange} className={inputClass}><option value="">Select type</option>{renderOptions(typeOptions)}</select></div>}
              </div>
            </section>

            <section className={`${cardClass} lg:sticky lg:top-0 lg:col-start-2 lg:row-start-1 lg:row-span-4`}>
              <SectionTitle description="Search broadly, then fine-tune the marker.">Location Details</SectionTitle>
              <PropertyLocationMap latitude={form.latitude} longitude={form.longitude} address={form.address} onLocationChange={handleMapLocationChange} onResolvingChange={setIsResolving} />
              <div className="mt-4 grid grid-cols-2 gap-3"><div><label htmlFor="latitude" className={labelClass}>Latitude *</label><input id="latitude" readOnly value={form.latitude} className={inputClass} placeholder="Not selected" /></div><div><label htmlFor="longitude" className={labelClass}>Longitude *</label><input id="longitude" readOnly value={form.longitude} className={inputClass} placeholder="Not selected" /></div></div>
              {coordinateError && <p role="alert" className="mt-2 text-sm text-red-600">{coordinateError}</p>}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"><div><label htmlFor="property-location" className={labelClass}>Location *</label><input id="property-location" name="location" required value={form.location} onChange={handleChange} className={inputClass} /></div><div><label htmlFor="property-address" className={labelClass}>Address *</label><textarea id="property-address" name="address" required rows={2} value={form.address} onChange={handleChange} className={`${inputClass} resize-none`} /></div></div>
            </section>

            <section className={`${cardClass} lg:col-start-1 lg:row-start-2`}><SectionTitle>Pricing and Land Details</SectionTitle><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{form.is_rented !== '1' && <><div><label htmlFor="per-cent" className={labelClass}>Per Cent *</label><input id="per-cent" name="per_cent" type="number" min="0" step="any" required value={form.per_cent} onChange={handleChange} className={inputClass} /></div><div><label htmlFor="total-cent" className={labelClass}>Total Cent *</label><input id="total-cent" name="total_cent" type="number" min="0" step="any" required value={form.total_cent} onChange={handleChange} className={inputClass} /></div></>}<div className="sm:col-span-2"><label htmlFor="property-amount" className={labelClass}>{form.is_rented === '1' ? 'Amount Per Month' : 'Amount'} *</label><input id="property-amount" name="amount" type="number" min="0" step="any" required value={form.amount} onChange={handleChange} className={inputClass} /></div></div></section>

            <section className={`${cardClass} lg:col-start-1 lg:row-start-3`}><SectionTitle description={initialData ? 'Leave unchanged to keep existing media.' : 'Upload at least one image and video.'}>Media</SectionTitle><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label htmlFor="property-images" className={labelClass}>Property Images *</label><input id="property-images" name="property_images_files" type="file" required={!initialData} multiple accept="image/*" onChange={handleChange} className={inputClass} /></div><div><label htmlFor="property-videos" className={labelClass}>Property Videos *</label><input id="property-videos" name="property_videos_files" type="file" required={!initialData} multiple accept="video/*" onChange={handleChange} className={inputClass} /></div></div></section>

            <section className={`${cardClass} lg:col-start-1 lg:row-start-4`}><SectionTitle>Features</SectionTitle><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label htmlFor="facilities" className={labelClass}>Facilities</label><select id="facilities" name="facilities_ids" multiple value={Array.isArray(form.facilities_ids) ? form.facilities_ids : toArray(form.facilities_ids)} onChange={handleChange} className={`${inputClass} min-h-28`}>{renderOptions(facilitiesOptions)}</select><p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple.</p></div><div><label htmlFor="amenities" className={labelClass}>Amenities</label><select id="amenities" name="amenities_ids" multiple value={Array.isArray(form.amenities_ids) ? form.amenities_ids : toArray(form.amenities_ids)} onChange={handleChange} className={`${inputClass} min-h-28`}>{renderOptions(amenitiesOptions)}</select><p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple.</p></div></div></section>
          </div>

          <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>{saveError && <p role="alert" className="text-sm text-red-600">{saveError}</p>}</div><div className="flex justify-end gap-3"><button type="button" onClick={onClose} disabled={isSaving} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50">Cancel</button><button type="submit" disabled={isSaving || isResolving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? 'Saving…' : isResolving ? 'Resolving location…' : initialData ? 'Save Changes' : 'Add Property'}</button></div>
          </footer>
        </form>
      </div>
    </div>
  );
}
