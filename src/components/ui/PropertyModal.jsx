import { useEffect, useMemo, useRef, useState } from 'react';
import PropertyLocationMap from '../PropertyLocationMap';

const emptyForm = {
  listing_purpose: 'sale',
  property_category_id: '',
  property_type_id: '',
  name: '',
  description: '',
  location: '',
  address: '',
  latitude: '',
  longitude: '',
  property_images_files: [],
  property_videos_files: [],
  per_cent: '',
  total_cent: '',
  amount: '',
  security_deposit: '',
  lease_duration: '',
  facilities_ids: [],
  amenities_ids: [],
};

const PURPOSES = [
  { value: 'sale', label: 'For Sale', description: 'List a property for purchase.' },
  { value: 'rent', label: 'For Rent', description: 'List a property with monthly rent.' },
  { value: 'lease', label: 'For Lease', description: 'List a property for a fixed lease term.' },
];

const CATEGORY_FALLBACKS = [
  { id: 'residential', name: 'Residential' },
  { id: 'commercial', name: 'Commercial' },
];

const TYPE_TAXONOMY = {
  residential: [
    { value: 'flat-apartment', label: 'Flat or Apartment', terms: ['flat', 'apartment'] },
    { value: 'house-villa', label: 'House or Villa', terms: ['house', 'villa'] },
    { value: 'land-plot-farm-house', label: 'Land, Plot, or Farm House', terms: ['land', 'plot', 'farm house', 'farmhouse'] },
    { value: 'builder-floor', label: 'Builder Floor', terms: ['builder floor', 'floor'] },
    { value: 'pg-coliving', label: 'PG or Co-Living Property', terms: ['pg', 'co-living', 'coliving', 'paying guest'] },
  ],
  commercial: [
    { value: 'building-showroom', label: 'Building or Showroom', terms: ['building', 'showroom'] },
    { value: 'retail-office', label: 'Retail Shop or Office', terms: ['retail', 'shop', 'office'] },
    { value: 'land-plot-farm-house', label: 'Land, Plot, or Farm House', terms: ['land', 'plot', 'farm house', 'farmhouse'] },
    { value: 'warehouse-godown', label: 'Warehouse or Godown', terms: ['warehouse', 'godown'] },
    { value: 'factory-manufacturing', label: 'Factory or Manufacturing', terms: ['factory', 'manufacturing'] },
  ],
};

const getOptionId = (option) => option?.id ?? option?._id ?? option?.value ?? option?.name;
const getOptionName = (option) => String(option?.name ?? option?.label ?? option?.title ?? getOptionId(option) ?? '');
const normalizeText = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
const firstId = (items, fallback) => {
  if (Array.isArray(items) && items.length) return String(getOptionId(items[0]) ?? items[0] ?? '');
  return String(Array.isArray(fallback) ? fallback[0] ?? '' : fallback ?? '');
};
const idArray = (items, fallback) => {
  if (Array.isArray(items) && items.length) return items.map((item) => String(getOptionId(item) ?? item)).filter(Boolean);
  if (Array.isArray(fallback)) return fallback.map(String).filter(Boolean);
  return String(fallback || '').split(',').map((item) => item.trim()).filter(Boolean);
};
const coordinate = (data, primary, fallback) => {
  const value = data?.[primary] ?? data?.[fallback] ?? '';
  return value === null ? '' : String(value);
};
const legacyRental = (value) => value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';
const inferPurpose = (data) => {
  if (['sale', 'rent', 'lease'].includes(data?.listing_purpose)) return data.listing_purpose;
  if (data?.lease_duration) return 'lease';
  return legacyRental(data?.is_rented) ? 'rent' : 'sale';
};

const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-400';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500';
const cardClass = 'rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5';

const Section = ({ number, title, description, children, className = '' }) => (
  <section className={`${cardClass} ${className}`}>
    <div className="mb-4 flex items-start gap-3 border-b border-gray-100 pb-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">{number}</span>
      <div><h3 className="font-semibold text-gray-900">{title}</h3>{description && <p className="mt-0.5 text-xs leading-5 text-gray-500">{description}</p>}</div>
    </div>
    {children}
  </section>
);

export default function PropertyModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  categoryOptions = [],
  typeOptions = [],
  amenitiesOptions = [],
  facilitiesOptions = [],
}) {
  const [form, setForm] = useState(emptyForm);
  const [coordinateError, setCoordinateError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const nameInputRef = useRef(null);

  const categories = useMemo(() => {
    const matching = categoryOptions.filter((option) => ['residential', 'commercial'].some((key) => normalizeText(getOptionName(option)).includes(key)));
    return matching.length ? matching : CATEGORY_FALLBACKS;
  }, [categoryOptions]);

  const selectedCategory = categories.find((option) => String(getOptionId(option)) === String(form.property_category_id));
  const categoryKey = normalizeText(getOptionName(selectedCategory)).includes('commercial') ? 'commercial' : selectedCategory ? 'residential' : '';

  const filteredTypes = useMemo(() => {
    if (!categoryKey) return [];
    const taxonomy = TYPE_TAXONOMY[categoryKey];
    const matched = typeOptions.filter((option) => {
      const name = normalizeText(getOptionName(option));
      return taxonomy.some((type) => type.terms.some((term) => name.includes(normalizeText(term))));
    });
    return matched.length ? matched : taxonomy.map((type) => ({ id: type.value, name: type.label }));
  }, [categoryKey, typeOptions]);

  const selectedType = filteredTypes.find((option) => String(getOptionId(option)) === String(form.property_type_id));
  const selectedTypeName = normalizeText(getOptionName(selectedType));
  const isLandType = ['land', 'plot', 'farm house', 'farmhouse'].some((term) => selectedTypeName.includes(normalizeText(term)));

  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = setTimeout(() => {
      setForm(initialData ? {
        ...emptyForm,
        listing_purpose: inferPurpose(initialData),
        property_category_id: String(initialData.property_category_id ?? firstId(initialData.property_categories, initialData.property_category_ids)),
        property_type_id: String(initialData.property_type_id ?? firstId(initialData.property_types, initialData.property_type_ids)),
        name: initialData.name || '',
        description: initialData.description || '',
        location: initialData.location || '',
        address: initialData.address || '',
        latitude: coordinate(initialData, 'latitude', 'lat'),
        longitude: coordinate(initialData, 'longitude', 'lng'),
        per_cent: initialData.per_cent || '',
        total_cent: initialData.total_cent || '',
        amount: initialData.amount_per_month || initialData.amount || '',
        security_deposit: initialData.security_deposit || '',
        lease_duration: initialData.lease_duration || '',
        facilities_ids: idArray(initialData.facilities, initialData.facilities_ids),
        amenities_ids: idArray(initialData.amenities, initialData.amenities_ids),
      } : { ...emptyForm });
      setCoordinateError('');
      setSaveError('');
    }, 0);
    const frame = requestAnimationFrame(() => nameInputRef.current?.focus());
    return () => { clearTimeout(timer); cancelAnimationFrame(frame); };
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
    if (type === 'file') {
      setForm((previous) => ({ ...previous, [name]: Array.from(files || []) }));
      return;
    }
    if (multiple) {
      setForm((previous) => ({ ...previous, [name]: Array.from(selectedOptions).map((option) => option.value) }));
      return;
    }
    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'property_category_id' ? { property_type_id: '', per_cent: '', total_cent: '' } : {}),
      ...(name === 'property_type_id' ? { per_cent: '', total_cent: '' } : {}),
      ...(name === 'listing_purpose' && value === 'sale' ? { security_deposit: '', lease_duration: '' } : {}),
      ...(name === 'listing_purpose' && value === 'rent' ? { lease_duration: '' } : {}),
    }));
  };

  const handleMapLocationChange = ({ latitude, longitude, address, location }) => {
    setCoordinateError('');
    setForm((previous) => ({
      ...previous,
      latitude: String(latitude ?? ''),
      longitude: String(longitude ?? ''),
      address: address ?? previous.address,
      location: location ?? previous.location,
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

    const isRental = form.listing_purpose === 'rent';
    const isLease = form.listing_purpose === 'lease';
    const canonicalPayload = {
      ...form,
      latitude,
      longitude,
      property_category_id: form.property_category_id,
      property_type_id: form.property_type_id,
    };

    setIsSaving(true);
    setSaveError('');
    try {
      await onSave({
        ...canonicalPayload,
        property_category_ids: form.property_category_id ? [form.property_category_id] : [],
        property_type_ids: form.property_type_id ? [form.property_type_id] : [],
        is_rented: isRental || isLease,
        ...(isRental ? { amount_per_month: form.amount } : { amount: form.amount }),
        ...(isLandType ? { per_cent: form.per_cent, total_cent: form.total_cent } : { per_cent: '', total_cent: '' }),
      });
    } catch (error) {
      setSaveError(error?.response?.data?.message || error?.message || 'The property could not be saved. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderOptions = (options) => options.map((option) => {
    const id = String(getOptionId(option));
    return <option key={id} value={id}>{getOptionName(option)}</option>;
  });

  const priceLabel = form.listing_purpose === 'rent' ? 'Monthly Rent' : form.listing_purpose === 'lease' ? 'Lease Amount' : 'Sale Price';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="property-modal-title">
      <button type="button" aria-label="Close property editor" className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-sm" onClick={isSaving ? undefined : onClose} />
      <div className="relative z-10 flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-4 sm:px-6">
          <div><h2 id="property-modal-title" className="text-lg font-semibold text-gray-900">{initialData ? 'Edit Property' : 'Add Property'}</h2><p className="text-xs text-gray-500">Choose the listing hierarchy, enter the relevant details, and mark the exact location.</p></div>
          <button type="button" aria-label="Close" disabled={isSaving} onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
            <Section number="01" title="Listing Purpose" description="How should this property be offered?">
              <fieldset><legend className="sr-only">Listing purpose</legend><div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{PURPOSES.map((purpose) => <label key={purpose.value} className={`cursor-pointer rounded-xl border p-3 transition ${form.listing_purpose === purpose.value ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'}`}><div className="flex items-center gap-2"><input type="radio" name="listing_purpose" value={purpose.value} checked={form.listing_purpose === purpose.value} onChange={handleChange} className="text-blue-600 focus:ring-blue-500" /><span className="text-sm font-semibold text-gray-900">{purpose.label}</span></div><p className="ml-6 mt-1 text-xs text-gray-500">{purpose.description}</p></label>)}</div></fieldset>
            </Section>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Section number="02" title="Property Category" description="Choose Residential or Commercial.">
                <label htmlFor="property-category" className={labelClass}>Category *</label><select id="property-category" name="property_category_id" required value={form.property_category_id} onChange={handleChange} className={inputClass}><option value="">Select category</option>{renderOptions(categories)}</select>
              </Section>
              <Section number="03" title="Property Type" description={categoryKey ? `Showing ${categoryKey} property types.` : 'Choose a category first.'}>
                <label htmlFor="property-type" className={labelClass}>Type *</label><select id="property-type" name="property_type_id" required disabled={!form.property_category_id} value={form.property_type_id} onChange={handleChange} className={inputClass}><option value="">{form.property_category_id ? 'Select property type' : 'Select category first'}</option>{renderOptions(filteredTypes)}</select>
              </Section>
            </div>

            <Section number="04" title="Property Details" description="Fields adapt to the selected property type.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><label htmlFor="property-name" className={labelClass}>Property Name *</label><input ref={nameInputRef} id="property-name" name="name" required value={form.name} onChange={handleChange} className={inputClass} placeholder="Enter a clear listing title" /></div><div className="sm:col-span-2"><label htmlFor="property-description" className={labelClass}>Description *</label><textarea id="property-description" name="description" required rows={4} value={form.description} onChange={handleChange} className={`${inputClass} resize-none`} placeholder="Describe the property and its highlights" /></div>{isLandType && <><div><label htmlFor="per-cent" className={labelClass}>Price Per Cent *</label><input id="per-cent" name="per_cent" type="number" min="0" step="any" required value={form.per_cent} onChange={handleChange} className={inputClass} /></div><div><label htmlFor="total-cent" className={labelClass}>Total Cent *</label><input id="total-cent" name="total_cent" type="number" min="0" step="any" required value={form.total_cent} onChange={handleChange} className={inputClass} /></div></>}</div>
            </Section>

            <Section number="05" title="Pricing" description="Pricing fields follow the selected listing purpose.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><div><label htmlFor="property-amount" className={labelClass}>{priceLabel} *</label><input id="property-amount" name="amount" type="number" min="0" step="any" required value={form.amount} onChange={handleChange} className={inputClass} /></div>{form.listing_purpose !== 'sale' && <div><label htmlFor="security-deposit" className={labelClass}>Security Deposit</label><input id="security-deposit" name="security_deposit" type="number" min="0" step="any" value={form.security_deposit} onChange={handleChange} className={inputClass} /></div>}{form.listing_purpose === 'lease' && <div><label htmlFor="lease-duration" className={labelClass}>Lease Duration *</label><input id="lease-duration" name="lease_duration" required value={form.lease_duration} onChange={handleChange} className={inputClass} placeholder="e.g. 3 years" /></div>}</div>
            </Section>

            <Section number="06" title="Location and Map" description="Search, click, or drag the marker to set the exact location.">
              <PropertyLocationMap latitude={form.latitude} longitude={form.longitude} address={form.address} onLocationChange={handleMapLocationChange} onResolvingChange={setIsResolving} />
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label htmlFor="property-location" className={labelClass}>Locality / City *</label><input id="property-location" name="location" required value={form.location} onChange={handleChange} className={inputClass} /></div><div><label htmlFor="property-address" className={labelClass}>Full Address *</label><textarea id="property-address" name="address" required rows={2} value={form.address} onChange={handleChange} className={`${inputClass} resize-none`} /></div><div><label htmlFor="latitude" className={labelClass}>Latitude *</label><input id="latitude" readOnly value={form.latitude} className={inputClass} placeholder="Select on map" /></div><div><label htmlFor="longitude" className={labelClass}>Longitude *</label><input id="longitude" readOnly value={form.longitude} className={inputClass} placeholder="Select on map" /></div></div>
              {coordinateError && <p role="alert" className="mt-2 text-sm text-red-600">{coordinateError}</p>}
            </Section>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Section number="07" title="Media" description={initialData ? 'New files are optional while editing.' : 'Upload property images and videos.'}>
                <div className="space-y-4"><div><label htmlFor="property-images" className={labelClass}>Property Images *</label><input id="property-images" name="property_images_files" type="file" required={!initialData} multiple accept="image/*" onChange={handleChange} className={inputClass} /></div><div><label htmlFor="property-videos" className={labelClass}>Property Videos *</label><input id="property-videos" name="property_videos_files" type="file" required={!initialData} multiple accept="video/*" onChange={handleChange} className={inputClass} /></div></div>
              </Section>
              <Section number="08" title="Facilities and Amenities" description="Select every feature available at the property.">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"><div><label htmlFor="facilities" className={labelClass}>Facilities</label><select id="facilities" name="facilities_ids" multiple value={form.facilities_ids} onChange={handleChange} className={`${inputClass} min-h-28`}>{renderOptions(facilitiesOptions)}</select></div><div><label htmlFor="amenities" className={labelClass}>Amenities</label><select id="amenities" name="amenities_ids" multiple value={form.amenities_ids} onChange={handleChange} className={`${inputClass} min-h-28`}>{renderOptions(amenitiesOptions)}</select></div></div><p className="mt-2 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple options.</p>
              </Section>
            </div>
          </div>

          <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>{saveError && <p role="alert" className="text-sm text-red-600">{saveError}</p>}</div><div className="flex justify-end gap-3"><button type="button" onClick={onClose} disabled={isSaving} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50">Cancel</button><button type="submit" disabled={isSaving || isResolving} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? 'Saving…' : isResolving ? 'Resolving location…' : initialData ? 'Save Changes' : 'Add Property'}</button></div>
          </footer>
        </form>
      </div>
    </div>
  );
}
