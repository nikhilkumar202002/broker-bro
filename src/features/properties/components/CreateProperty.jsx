import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import PropertyLocationMap from '../../../components/PropertyLocationMap';
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
  listing_purpose: 'sale',
  name: '',
  description: '',
  location: '',
  address: '',
  latitude: '',
  longitude: '',
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
  security_deposit: '',
  lease_duration: '',
  bhk: '',
  no_of_bedrooms: '',
  no_of_bathrooms: '',
  no_of_kitchen: '',
  no_of_halls: '',
  sq_feet: '',
  is_rented: '0',
  facilities_ids: [],
  amenities_ids: [],
});

const inputClass =
  'w-full h-11 px-3 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none bg-white disabled:bg-gray-50 disabled:text-gray-400';
const textareaClass =
  'w-full h-28 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none resize-none';
const fileInputClass =
  'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-blue-700 hover:file:bg-blue-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5';

const sectionSteps = {
  'Listing Purpose': '01',
  'Property Classification': '02',
  'Property Basic Details': '03',
  'Property Size & Pricing': '04',
  'Pricing Details': '04',
  'Property Specifications': '05',
  'Mark Property Location': '06',
  'Location Details': '06',
  'Media Uploads': '07',
  'Features & Facilities': '08',
};

const PURPOSES = [
  { value: 'sale', label: 'For Sale', description: 'Offer this property for purchase.' },
  { value: 'rent', label: 'For Rent', description: 'Charge a recurring monthly rent.' },
  { value: 'lease', label: 'For Lease', description: 'Offer a fixed-term property lease.' },
];

const CATEGORY_TAXONOMY = [
  { kind: 'residential', label: 'Residential', terms: ['residential'] },
  { kind: 'commercial', label: 'Commercial', terms: ['commercial'] },
];

const TYPE_TAXONOMY = {
  residential: [
    { value: 'flat-apartment', label: 'Flat or Apartment', terms: ['flat', 'apartment'] },
    { value: 'house-villa', label: 'House or Villa', terms: ['house', 'villa'] },
    { value: 'land-plot-farm-house', label: 'Land, Plot, or Farm House', terms: ['land', 'plot', 'farm house', 'farmhouse'] },
    { value: 'builder-floor', label: 'Builder Floor', terms: ['builder floor'] },
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

const normalizeText = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');

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

const mergeById = (items) => {
  const seen = new Set();

  return items.filter((item) => {
    const key = item?.id ?? item?._id ?? item?.name;
    if (!key || seen.has(String(key))) return false;
    seen.add(String(key));
    return true;
  });
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

const getDefaultRegionalForm = (countries = [], states = []) => {
  const india = countries.find((country) => String(country.name).trim().toLowerCase() === 'india');
  const kerala = states.find((state) => String(state.name).trim().toLowerCase() === 'kerala');

  return {
    ...emptyFormData(),
    country_id: india ? String(india.id) : '',
    state_id: kerala ? String(kerala.id) : '',
    district_id: '',
  };
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
  const [locationResolving, setLocationResolving] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
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

        const normalizedCountries = normalizeOptions(getItemsPayload(countriesRes, ['countries']));
        const india = normalizedCountries.find((country) => String(country.name).trim().toLowerCase() === 'india');

        setCategories(normalizeOptions(getItemsPayload(categoriesRes, ['propertyCategories', 'categories'])));
        setPropertyTypes(normalizeOptions(getItemsPayload(typesRes, ['propertyTypes', 'types'])));
        setFacilities(normalizeOptions(getItemsPayload(facilitiesRes, ['facilities'])));
        setAmenities(normalizeOptions(getItemsPayload(amenitiesRes, ['amenities'])));
        setCountries(normalizedCountries);
        if (india) {
          setFormData((current) => current.country_id
            ? current
            : { ...current, country_id: String(india.id), state_id: '', district_id: '' });
        }
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
        const allStates = [];
        const allDistrictsList = [];
        let page = 1;
        let totalPages = 1;

        do {
          const response = await getCountryStatesDistricts(formData.country_id, { page, limit: 100 });
          if (!mounted) return;

          const payload = getPayload(response);
          const stateList = payload?.states ?? payload?.country?.states ?? [];
          const districtList = [
            ...(payload?.districts ?? payload?.country?.districts ?? []),
            ...stateList.flatMap((state) => state?.districts ?? []),
          ];

          allStates.push(...stateList);
          allDistrictsList.push(...districtList);

          totalPages = payload?.pagination?.totalPages ?? payload?.meta?.totalPages ?? page;
          page += 1;
        } while (page <= totalPages);

        const normalizedStates = normalizeOptions(mergeById(allStates));
        const kerala = normalizedStates.find((state) => String(state.name).trim().toLowerCase() === 'kerala');

        setStates(normalizedStates);
        setAllDistricts(normalizeOptions(mergeById(allDistrictsList)));
        if (kerala) {
          setFormData((current) => current.state_id
            ? current
            : { ...current, state_id: String(kerala.id), district_id: '' });
        }
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

  const visibleCategories = useMemo(() => {
    return CATEGORY_TAXONOMY.map((definition) => {
      const apiCategory = categories.find((category) => {
        const categoryText = normalizeText(category.name);
        return definition.terms.some((term) => categoryText.includes(normalizeText(term)));
      });

      return {
        ...(apiCategory || {}),
        id: apiCategory?.id ?? definition.kind,
        name: definition.label,
        kind: definition.kind,
      };
    });
  }, [categories]);

  const selectedCategory = visibleCategories.find((category) => String(category.id) === String(formData.property_category_ids));
  const categoryKey = selectedCategory?.kind || '';
  const visiblePropertyTypes = useMemo(() => {
    if (!categoryKey) return [];
    return TYPE_TAXONOMY[categoryKey].map((definition) => {
      const apiType = propertyTypes.find((type) => {
        const typeText = normalizeText(`${type.value || ''} ${type.name || ''}`);
        return definition.terms.some((term) => typeText.includes(normalizeText(term)));
      });

      return {
        ...(apiType || {}),
        id: apiType?.id ?? definition.value,
        name: definition.label,
        taxonomyValue: definition.value,
      };
    });
  }, [categoryKey, propertyTypes]);

  const selectedPropertyType = visiblePropertyTypes.find((type) => String(type.id) === String(formData.property_type_ids));
  const selectedTypeText = `${selectedPropertyType?.value || ''} ${selectedPropertyType?.name || ''} ${formData.property_type_value || ''}`.toLowerCase();
  const isPlotType = selectedTypeText.includes('plot') || selectedTypeText.includes('land');
  const isBuildingType =
    selectedTypeText.includes('building') ||
    selectedTypeText.includes('house') ||
    selectedTypeText.includes('flat') ||
    selectedTypeText.includes('apartment') ||
    selectedTypeText.includes('villa');
  const hidesLocationDetails = isPlotType || isBuildingType;
  const isRental = formData.listing_purpose === 'rent';
  const isLease = formData.listing_purpose === 'lease';

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

      if (key === 'listing_purpose') {
        next.is_rented = value === 'sale' ? '0' : '1';
        if (value === 'sale') {
          next.security_deposit = '';
          next.lease_duration = '';
        } else if (value === 'rent') {
          next.lease_duration = '';
        }
      }

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
      const selected = visiblePropertyTypes.find((type) => String(type.id) === String(value));
      setFormData((current) => ({
        ...current,
        property_type_ids: value,
        property_type_value: selected?.taxonomyValue || selected?.value || selected?.name || '',
      }));
      return;
    }

    if (key === 'property_category_ids') {
      setFormData((current) => ({
        ...current,
        property_category_ids: value,
        property_type_ids: '',
        property_type_value: '',
        per_cent: '',
        total_cent: '',
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

  const handleMapLocationChange = ({ latitude, longitude, address, location }) => {
    setError(null);
    setFormData((current) => ({
      ...current,
      latitude: String(latitude ?? ''),
      longitude: String(longitude ?? ''),
      address: address ?? current.address,
      location: location ?? current.location,
    }));
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

  const removeMediaFile = (key, index) => {
    setFormData((current) => ({
      ...current,
      [key]: Array.isArray(current[key]) ? current[key].filter((_, itemIndex) => itemIndex !== index) : [],
    }));
    setMediaInputKey((current) => current + 1);
  };

  const renderTextInput = (key, label, props = {}) => (
    <div>
      <label className={labelClass}>
        {label}
        {props.required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <input
        {...props}
        value={formData[key]}
        onChange={(event) => updateField(key, event.target.value)}
        className={inputClass}
      />
    </div>
  );

  const renderSection = (title, children, description) => {
    const isWide = !['Property Basic Details', 'Property Classification'].includes(title);
    const orderClass = title === 'Property Classification'
      ? 'order-1'
      : ['Property Basic Details', 'Property Specifications'].includes(title)
        ? 'order-2'
        : ['Property Size & Pricing', 'Pricing Details'].includes(title)
          ? 'order-3'
          : ['Mark Property Location', 'Location Details'].includes(title)
            ? 'order-4'
            : title === 'Media Uploads' ? 'order-5' : 'order-6';

    return (
    <section className={`h-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:p-5 ${orderClass} ${isWide ? 'lg:col-span-2' : ''}`}>
      <div className="mb-5 flex items-start gap-3 border-b border-gray-100 pb-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-sm">
          {sectionSteps[title] || '•'}
        </span>
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {description && <p className="mt-1 max-w-2xl text-xs leading-5 text-gray-500">{description}</p>}
        </div>
      </div>
      {children}
    </section>
    );
  };

  const locationMapSection = renderSection(
    'Mark Property Location',
    <div className="space-y-4">
      <PropertyLocationMap
        latitude={formData.latitude}
        longitude={formData.longitude}
        address={formData.address}
        onLocationChange={handleMapLocationChange}
        onResolvingChange={setLocationResolving}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Latitude <span className="text-red-500">*</span></label>
          <input readOnly value={formData.latitude} placeholder="Select on map" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Longitude <span className="text-red-500">*</span></label>
          <input readOnly value={formData.longitude} placeholder="Select on map" className={inputClass} />
        </div>
        {renderTextInput('location', 'Locality / City', { required: true, placeholder: 'Automatically filled from map' })}
        {renderTextInput('address', 'Full Address', { required: true, placeholder: 'Automatically filled; edit if needed' })}
      </div>
    </div>,
    'Search for a city, locality, landmark, or full address, then fine-tune the marker.'
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

  const renderAssetCards = (items, type, fieldKey) =>
    items.length > 0 && (
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item, index) => (
          <div key={item.url} className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
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
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-[11px] text-gray-400">{formatFileSize(item.size)}</span>
                <button
                  type="button"
                  onClick={() => removeMediaFile(fieldKey, index)}
                  className="text-[11px] font-medium text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!disclaimerAccepted) {
      setError('Please accept the disclaimer before submitting the property.');
      return;
    }

    const latitude = Number(formData.latitude);
    const longitude = Number(formData.longitude);
    if (
      formData.latitude === '' ||
      formData.longitude === '' ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      setError('Select a valid property location on the map before submitting.');
      return;
    }

    if (formData.property_videos_files.length > 2) {
      setError('Maximum 2 videos allowed.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const {
        amount,
        property_type_ids: propertyTypeId,
        property_type_value: propertyTypeValue,
        per_cent: perCent,
        total_cent: totalCent,
        bhk,
        sq_feet: sqFeet,
        latitude: ignoredLatitude,
        longitude: ignoredLongitude,
        ...restFormData
      } = formData;
      void ignoredLatitude;
      void ignoredLongitude;
      const propertyTypePayload =
        propertyTypeId ? { property_type_ids: [propertyTypeId], property_type_value: propertyTypeValue } : {};
      const plotPayload = { per_cent: perCent, total_cent: totalCent };
      const bhkPayload = { bhk };
      const sqFeetPayload = { sq_feet: sqFeet };
      const response = await createProperty({
        ...restFormData,
        ...plotPayload,
        ...bhkPayload,
        ...sqFeetPayload,
        listing_purpose: formData.listing_purpose,
        is_rented: isRental || isLease,
        latitude,
        longitude,
        ...(isRental ? { amount_per_month: amount } : { amount }),
        property_category_ids: formData.property_category_ids ? [formData.property_category_ids] : [],
        ...propertyTypePayload,
      });
      toast.success('Property created successfully');
      setFormData(getDefaultRegionalForm(countries, states));
      setDisclaimerAccepted(false);
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
    setFormData(getDefaultRegionalForm(countries, states));
    setDisclaimerAccepted(false);
    setError(null);
    setMediaInputKey((current) => current + 1);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-700 to-blue-500 px-5 py-5 text-white shadow-sm md:px-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Add Property</h1>
            <p className="mt-1 text-sm text-blue-100">Create a complete listing in a few clear steps. Start by marking the exact location.</p>
          </div>
          <div className="inline-flex w-fit rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            New property listing
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-gray-200 bg-slate-50 shadow-sm">
        <div className="space-y-5 p-4 md:p-6">
          {renderSection(
            'Listing Purpose',
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {PURPOSES.map((purpose) => (
                <label key={purpose.value} className={`cursor-pointer rounded-xl border p-3 transition-colors ${formData.listing_purpose === purpose.value ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="listing_purpose" value={purpose.value} checked={formData.listing_purpose === purpose.value} onChange={(event) => updateField('listing_purpose', event.target.value)} className="h-4 w-4 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm font-semibold text-gray-900">{purpose.label}</span>
                  </div>
                  <p className="ml-6 mt-1 text-xs text-gray-500">{purpose.description}</p>
                </label>
              ))}
            </div>,
            'Choose how this property will be offered before selecting its classification.'
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-stretch">
          {renderSection(
            'Property Basic Details',
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                {renderTextInput('name', 'Name', { required: true, placeholder: 'Property name' })}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Description <span className="font-normal normal-case text-gray-400">(optional)</span></label>
                <textarea
                  value={formData.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  className={textareaClass}
                  placeholder="Short description"
                />
              </div>
            </div>,
            'Choose the listing purpose, then add the customer-facing title, description, and address.'
          )}

          {renderSection(
            'Property Classification',
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Category <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {visibleCategories.map((category) => (
                    <label key={category.id} className={`cursor-pointer rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${String(formData.property_category_ids) === String(category.id) ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}>
                      <input type="radio" name="property_category_ids" value={category.id} checked={String(formData.property_category_ids) === String(category.id)} onChange={(event) => handleSelect(event, 'property_category_ids')} className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500" required />
                      {category.name}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                  <label className={labelClass}>Property Type <span className="text-red-500">*</span></label>
                  <select
                    value={formData.property_type_ids}
                    onChange={(event) => handleSelect(event, 'property_type_ids')}
                    className={inputClass}
                    disabled={!formData.property_category_ids}
                    required
                  >
                    <option value="">{!formData.property_category_ids ? 'Select category first' : listsLoading ? 'Loading types...' : 'Select type'}</option>
                    {visiblePropertyTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
              </div>
            </div>,
            'Classification controls which pricing and specification fields appear next.'
          )}

          {!hidesLocationDetails &&
            renderSection(
              'Location Details',
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              </div>,
              'Use these fields when the selected property type needs regional details.'
            )}

          {renderSection(
            isPlotType || isBuildingType ? 'Property Size & Pricing' : 'Pricing Details',
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {isPlotType && renderTextInput('per_cent', 'Per Cent', { type: 'number', min: '0' })}
              {isPlotType && renderTextInput('total_cent', 'Total Cent', { type: 'number', min: '0' })}
              {isBuildingType && renderTextInput('sq_feet', 'Sq Feet', { type: 'number', min: '0' })}
              {!isPlotType && !isBuildingType && renderTextInput('total_cent', 'Total Cent', { type: 'number', min: '0' })}
              {renderTextInput('amount', isRental ? 'Monthly Rent' : isLease ? 'Lease Amount' : 'Sale Price', { type: 'number', min: '0', required: true })}
              {(isRental || isLease) && renderTextInput('security_deposit', 'Security Deposit', { type: 'number', min: '0' })}
              {isLease && renderTextInput('lease_duration', 'Lease Duration', { required: true, placeholder: 'e.g. 3 years' })}
            </div>,
            isPlotType ? 'For plots, amount is calculated from per cent and total cent when both values are entered.' : 'Add the size and final listing amount.'
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
              </div>,
              'Optional room and layout details for built properties.'
            )}

          {locationMapSection}

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
            </div>,
            'Pick multiple items one at a time; selected items appear below each field.'
          )}

          {renderSection(
            'Media Uploads',
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Property Images <span className="text-red-500">*</span></label>
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
                {renderAssetCards(imagePreviews, 'image', 'property_images_files')}
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
                {renderAssetCards(videoPreviews, 'video', 'property_videos_files')}
              </div>
            </div>,
            'Images are required. Videos are optional and limited to two files.'
          )}

          </div>

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        </div>

        <div className="border-t border-amber-200 bg-amber-50 px-4 py-4 md:px-6">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-white/70 p-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={disclaimerAccepted}
              onChange={(event) => {
                setDisclaimerAccepted(event.target.checked);
                if (event.target.checked) setError(null);
              }}
              required
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span>
              I confirm that the property details, location, pricing, and uploaded media are accurate and that I am authorized to publish this listing.
              <span className="ml-1 font-medium text-red-500">*</span>
            </span>
          </label>
          <p className="ml-10 mt-2 text-xs text-gray-500">Required confirmation before the property can be submitted.</p>
        </div>

        <div className="sticky bottom-0 z-10 px-4 md:px-6 py-4 bg-white/95 backdrop-blur border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500"><span className="font-semibold text-gray-700">Ready to publish?</span> Review required fields marked with <span className="text-red-500">*</span>.</p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={onCancel || handleReset}
            className="w-full sm:w-auto px-5 py-2.5 border border-gray-200 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            disabled={submitting || locationResolving}
          >
            {onCancel ? 'Cancel' : 'Reset'}
          </button>
          <button
            type="submit"
            disabled={submitting || locationResolving || !disclaimerAccepted}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : locationResolving ? 'Resolving location...' : 'Add Property'}
          </button>
          </div>
        </div>
      </form>
    </div>
  );
}
