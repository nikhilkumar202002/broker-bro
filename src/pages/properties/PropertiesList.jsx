import { useState, useEffect } from 'react';
import CreateProperty from '../../features/properties/components/CreateProperty';
import { getCategories, getProperties, getPropertyTypes, getPropertyStatuses, approveProperty, featureProperty, unfeatureProperty, updatePropertyStatus } from '../../services/api';
import toast from 'react-hot-toast';
import { FiCheck, FiTrash2, FiEye, FiStar, FiPower, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const initialProperties = [];

const PropertyCardSkeleton = () => (
  <article className="h-full bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
    <div className="flex flex-col sm:flex-row h-full animate-pulse">
      <div className="sm:w-1/2 shrink-0 self-stretch bg-gray-100">
        <div className="h-48 sm:h-full min-h-56 w-full bg-gray-200" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="h-5 w-2/3 rounded bg-gray-200" />
          <div className="h-5 w-20 shrink-0 rounded-full bg-gray-200" />
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full rounded bg-gray-100" />
          <div className="h-3 w-4/5 rounded bg-gray-100" />
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-3 w-16 rounded bg-gray-100" />
              <div className="h-4 w-24 rounded bg-gray-200" />
            </div>
          ))}
        </div>

        <div className="mt-auto pt-5 flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-9 w-24 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  </article>
);

const statusStyles = {
  Approved: 'bg-green-100 text-green-700',
  Active: 'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Draft: 'bg-yellow-100 text-yellow-700',
  Rejected: 'bg-red-100 text-red-700',
  Sold: 'bg-gray-100 text-gray-500',
};

const getPropertiesPayload = (response) => {
  const payload = response?.data?.data ?? response?.data ?? {};

  if (Array.isArray(payload?.properties)) {
    return {
      items: payload.properties,
      pagination: payload.pagination ?? null,
    };
  }

  if (Array.isArray(payload)) {
    return { items: payload, pagination: null };
  }

  if (Array.isArray(payload?.data)) {
    return { items: payload.data, pagination: payload.pagination ?? payload.meta ?? null };
  }

  return { items: [], pagination: null };
};

const getCategoriesPayload = (response) => {
  const payload = response?.data?.data ?? response?.data ?? {};

  if (Array.isArray(payload?.propertyCategories)) return payload.propertyCategories;
  if (Array.isArray(payload?.categories)) return payload.categories;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;

  return [];
};

const getPropertyTypesPayload = (response) => {
  const payload = response?.data?.data ?? response?.data ?? {};

  if (Array.isArray(payload?.propertyTypes)) return payload.propertyTypes;
  if (Array.isArray(payload?.types)) return payload.types;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;

  return [];
};

const getPropertyStatusesPayload = (response) => {
  const payload = response?.data?.data ?? response?.data ?? {};

  if (Array.isArray(payload?.propertyStatuses)) return payload.propertyStatuses;
  if (Array.isArray(payload?.statuses)) return payload.statuses;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;

  return [];
};

const getPropertyId = (property) => property?.id ?? property?._id;
const getOptionId = (option) => option?.id ?? option?._id ?? option?.value ?? option?.name;
const normalizeStatusText = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
const getStatusOptionKey = (status) => normalizeStatusText(status?.value ?? status?.name ?? status?.status ?? status?.label);
const getPropertyImageUrl = (property) => {
  const image =
    property?.image_full_url ||
    property?.full_image_url ||
    property?.image_url ||
    property?.image_path ||
    property?.thumbnail_full_url ||
    property?.thumbnail_url ||
    property?.property_images?.[0] ||
    property?.images?.[0];

  if (!image || typeof image === 'string') {
    return image || '';
  }

  return image.image_full_url || image.full_image_url || image.image_url || image.url || image.path || '';
};

const getImageItemUrl = (image) => {
  if (!image || typeof image === 'string') return image || '';
  return image.image_full_url || image.full_image_url || image.image_url || image.url || image.path || '';
};

const getPropertyImageUrls = (property) => {
  const candidates = [
    property?.property_images,
    property?.images,
    property?.gallery,
    property?.photos,
  ].filter(Array.isArray).flat();

  const urls = candidates.map(getImageItemUrl).filter(Boolean);
  const primaryUrl = getPropertyImageUrl(property);

  return Array.from(new Set([primaryUrl, ...urls].filter(Boolean)));
};

const getPropertyStatusLabel = (property) => {
  if (property?.is_approved === true) return 'Approved';
  if (property?.is_approved === false) return 'Rejected';
  return property?.property_status?.name || property?.property_status || 'Pending';
};

const formatCurrency = (value) => {
  if (value === null || typeof value === 'undefined' || value === '') return '-';
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return value;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numberValue);
};

const formatValue = (value, suffix = '') => {
  if (value === null || typeof value === 'undefined' || value === '') return '-';
  return `${value}${suffix}`;
};

const joinNames = (items) => {
  if (!Array.isArray(items) || items.length === 0) return '-';
  return items.map((item) => item?.name ?? item).filter(Boolean).join(', ') || '-';
};

const getAreaDisplay = (property) => {
  const typeNames = (property?.property_types || property?.types || [])
    .map((type) => type?.name ?? type)
    .join(' ')
    .toLowerCase();

  if (typeNames.includes('plot')) {
    if (property?.total_cent) return formatValue(property.total_cent, ' cent');

    const amount = Number(property?.amount);
    const perCent = Number(property?.per_cent);
    if (amount > 0 && perCent > 0) {
      const calculatedCent = amount / perCent;
      return `${Number.isInteger(calculatedCent) ? calculatedCent : calculatedCent.toFixed(2)} cent`;
    }

    if (property?.sq_feet) return formatValue(property.sq_feet, ' sq ft');
    return '-';
  }

  if (property?.sq_feet) return formatValue(property.sq_feet, ' sq ft');
  if (property?.total_cent) return formatValue(property.total_cent, ' cent');

  return '-';
};

const isPropertyFeatured = (property) =>
  property?.is_featured === true ||
  property?.is_featured === 1 ||
  property?.is_featured === '1' ||
  String(property?.is_featured).toLowerCase() === 'true' ||
  String(property?.featured).toLowerCase() === 'true';

const isPropertyActive = (property) => {
  const status = property?.status ?? property?.property_status?.value ?? property?.property_status?.name ?? property?.property_status;

  return status === true ||
    status === 1 ||
    status === '1' ||
    String(status).toLowerCase() === 'active';
};

export default function PropertiesList() {
  const [properties, setProperties] = useState(initialProperties);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewingProperty, setViewingProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [updatingIds, setUpdatingIds] = useState([]);
  const [featuringIds, setFeaturingIds] = useState([]);
  const [statusUpdatingIds, setStatusUpdatingIds] = useState([]);
  const [galleryIndexes, setGalleryIndexes] = useState({});

  const getPropertyOptionKeys = (items) =>
    (items || []).flatMap((item) => [
      item?.id,
      item?._id,
      item?.value,
      item?.name,
    ]).filter(Boolean).map(String);

  const filtered = properties.filter((p) => {
    const categoryKeys = getPropertyOptionKeys(p.property_categories || p.categories);
    const typeKeys = getPropertyOptionKeys(p.property_types || p.types);
    const matchesSearch =
      String(p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      String(getPropertyId(p) || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || categoryKeys.includes(String(categoryFilter));
    const matchesType = typeFilter === 'all' || typeKeys.includes(String(typeFilter));
    return matchesSearch && matchesCategory && matchesType;
  });

  const fetchProperties = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProperties({ page, limit: 10 });
      const { items, pagination } = getPropertiesPayload(res);
      setProperties(items);
      setMeta(pagination);
    } catch (e) {
      console.error('Failed to load properties', e);
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProperties(1);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [categoriesRes, typesRes] = await Promise.all([
          getCategories({ status: 'active', limit: 100 }),
          getPropertyTypes({ status: 'active', limit: 100 }),
        ]);

        setCategoryOptions(getCategoriesPayload(categoriesRes));
        setTypeOptions(getPropertyTypesPayload(typesRes));
      } catch (e) {
        console.error('Failed to load property filters', e);
      }
    };

    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const res = await getPropertyStatuses({ limit: 100 });
        setStatusOptions(getPropertyStatusesPayload(res));
      } catch (e) {
        console.error('Failed to load property statuses', e);
      }
    };

    fetchStatuses();
  }, []);

  const handleDelete = (id) => {
    setProperties((prev) => prev.filter((p) => getPropertyId(p) !== id));
  };

  const handleCreateSuccess = () => {
    setModalOpen(false);
    fetchProperties(currentPage);
  };

  const handleApprove = async (property) => {
    const id = getPropertyId(property);
    try {
      setUpdatingIds((s) => [...s, id]);
      const res = await approveProperty(id);
      const updated = res?.data?.data ?? res?.data ?? null;
      if (updated) {
        setProperties((prev) => prev.map((p) => (getPropertyId(p) === id ? { ...p, ...updated } : p)));
        toast.success('Property approved');
      } else {
        // Fallback: mark as approved locally
        setProperties((prev) => prev.map((p) => (getPropertyId(p) === id ? { ...p, is_approved: true, property_status: { name: 'Approved' } } : p)));
        toast.success('Property approved');
      }
    } catch (e) {
      console.error('Approve failed', e);
    } finally {
      setUpdatingIds((s) => s.filter((x) => x !== id));
    }
  };

  const handleToggleFeatured = async (property) => {
    const id = getPropertyId(property);
    const isFeatured = isPropertyFeatured(property);
    const togglePromise = isFeatured ? unfeatureProperty(id) : featureProperty(id);

    try {
      setFeaturingIds((prev) => [...prev, id]);
      await togglePromise;
      setProperties((prev) =>
        prev.map((item) =>
          getPropertyId(item) === id
            ? { ...item, is_featured: !isFeatured, featured: !isFeatured }
            : item
        )
      );
      toast.success(isFeatured ? 'Property unfeatured' : 'Property featured');
    } catch (e) {
      console.error('Feature toggle failed', e);
    } finally {
      setFeaturingIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const handleToggleStatus = async (property) => {
    const id = getPropertyId(property);
    const currentlyActive = isPropertyActive(property);
    const nextStatus = currentlyActive ? 'unactive' : 'active';
    const nextStatusOption = statusOptions.find((status) => {
      const key = getStatusOptionKey(status);
      return nextStatus === 'active'
        ? key === 'active'
        : key === 'unactive' || key === 'inactive';
    });
    const nextStatusId = getOptionId(nextStatusOption);

    if (!nextStatusId) {
      toast.error(`Unable to find ${nextStatus} status id`);
      return;
    }

    try {
      setStatusUpdatingIds((prev) => [...prev, id]);
      await updatePropertyStatus(id, { property_status_id: nextStatusId });
      setProperties((prev) =>
        prev.map((item) =>
          getPropertyId(item) === id
            ? {
                ...item,
                property_status_id: nextStatusId,
                property_status: nextStatusOption,
              }
            : item
        )
      );
      toast.success(nextStatus === 'active' ? 'Property activated' : 'Property set as unactive');
    } catch (e) {
      console.error('Status update failed', e);
    } finally {
      setStatusUpdatingIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const handleGalleryStep = (propertyId, imageCount, step) => {
    setGalleryIndexes((prev) => {
      const currentIndex = prev[propertyId] ?? 0;
      const nextIndex = (currentIndex + step + imageCount) % imageCount;
      return { ...prev, [propertyId]: nextIndex };
    });
  };

  const currentPage = meta?.page ?? meta?.current_page ?? 1;
  const totalPages = meta?.totalPages ?? meta?.last_page ?? 1;
  const total = meta?.total ?? properties.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Properties</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and view all your property listings.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Property
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:max-w-xl">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categoryOptions.map((category) => {
              const optionId = String(getOptionId(category));

              return (
                <option key={optionId} value={optionId}>
                  {category.name}
                </option>
              );
            })}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            {typeOptions.map((type) => {
              const optionId = String(getOptionId(type));

              return (
                <option key={optionId} value={optionId}>
                  {type.name}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => <PropertyCardSkeleton key={index} />)
        ) : error ? (
          <div className="xl:col-span-2 bg-white border border-red-100 rounded-xl px-5 py-10 text-center text-sm text-red-500 shadow-sm">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="xl:col-span-2 bg-white border border-gray-100 rounded-xl px-5 py-10 text-center text-sm text-gray-400 shadow-sm">
            No properties found.
          </div>
        ) : (
          filtered.map((property) => {
            const propertyId = getPropertyId(property);
            const statusLabel = getPropertyStatusLabel(property);
            const isFeatured = isPropertyFeatured(property);
            const isActive = isPropertyActive(property);
            const imageUrls = getPropertyImageUrls(property);
            const activeImageIndex = Math.min(galleryIndexes[propertyId] ?? 0, Math.max(imageUrls.length - 1, 0));
            const imageUrl = imageUrls[activeImageIndex];
            const categoryName = ((property.property_categories || property.categories || [])[0]?.name) || '-';
            const typeName = (property.property_types && property.property_types[0] && property.property_types[0].name) || '-';
            const propertyAmount = property.total_amount ?? property.amount;
            const createdDate = property.createdAt || property.created_at
              ? new Date(property.createdAt ?? property.created_at).toLocaleDateString()
              : '-';

            return (
              <article
                key={propertyId}
                className="h-full bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden transition-colors hover:border-blue-100"
              >
                <div className="flex flex-col sm:flex-row h-full">
                  <div className="relative sm:w-1/2 shrink-0 self-stretch bg-gray-100">
                    {imageUrl ? (
                      <>
                        <img
                          src={imageUrl}
                          alt={property.name || 'Property'}
                          className="h-48 sm:h-full min-h-56 w-full object-cover"
                        />
                        {imageUrls.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleGalleryStep(propertyId, imageUrls.length, -1)}
                              className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow hover:bg-white"
                              title="Previous image"
                            >
                              <FiChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleGalleryStep(propertyId, imageUrls.length, 1)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow hover:bg-white"
                              title="Next image"
                            >
                              <FiChevronRight className="h-5 w-5" />
                            </button>
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
                              {activeImageIndex + 1} / {imageUrls.length}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="h-48 sm:h-full min-h-56 w-full flex items-center justify-center text-sm text-gray-400">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="min-w-0 text-lg font-semibold text-gray-900 break-words">
                          {property.name || 'Untitled property'}
                        </h2>
                        <span className={`shrink-0 inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[statusLabel] || 'bg-gray-100 text-gray-500'}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                          {property.description || property.location || property.address || 'No description added.'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-xs font-medium uppercase text-gray-400">Category</div>
                        <div className="mt-1 text-gray-700">{categoryName}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium uppercase text-gray-400">Type</div>
                        <div className="mt-1 text-gray-700">{typeName}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium uppercase text-gray-400">Date</div>
                        <div className="mt-1 text-gray-700">{createdDate}</div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-xs font-medium uppercase text-gray-400">Location</div>
                        <div className="mt-1 text-gray-700">{property.location || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium uppercase text-gray-400">Price</div>
                        <div className="mt-1 font-semibold text-gray-900">{formatCurrency(propertyAmount)}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium uppercase text-gray-400">Area</div>
                        <div className="mt-1 text-gray-700">
                          {getAreaDisplay(property)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-5 flex flex-wrap items-center justify-start gap-2">
                      <button
                        onClick={() => handleToggleStatus(property)}
                        disabled={statusUpdatingIds.includes(propertyId)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg disabled:opacity-50 ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <FiPower className="w-4 h-4" />
                        {statusUpdatingIds.includes(propertyId) ? 'Saving...' : isActive ? 'Active' : 'Unactive'}
                      </button>
                      <button
                        onClick={() => handleToggleFeatured(property)}
                        disabled={featuringIds.includes(propertyId)}
                        title={isFeatured ? 'Set as unfeatured' : 'Set as featured'}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg disabled:opacity-50 ${
                          isFeatured
                            ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <FiStar className={`w-4 h-4 ${isFeatured ? 'fill-current' : ''}`} />
                        {featuringIds.includes(propertyId) ? 'Saving...' : isFeatured ? 'Featured' : 'Feature'}
                      </button>
                      <button
                        onClick={() => setViewingProperty(property)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        <FiEye className="w-4 h-4" />
                        View Details
                      </button>
                      {property.is_approved !== true && (
                        <button
                          onClick={() => handleApprove(property)}
                          disabled={updatingIds.includes(propertyId)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
                        >
                          <FiCheck className="w-4 h-4" />
                          {updatingIds.includes(propertyId) ? 'Approving...' : 'Approval'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(propertyId)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
      {meta && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">Page {currentPage} of {totalPages} - {total} total</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchProperties(currentPage - 1)}
              disabled={!(meta.prevPageUrl || meta.prev)}
              className="px-3 py-1 text-sm rounded bg-gray-100 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => fetchProperties(currentPage + 1)}
              disabled={!(meta.nextPageUrl || meta.next)}
              className="px-3 py-1 text-sm rounded bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {viewingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewingProperty(null)} />
          <div className="relative z-10 w-full max-w-4xl mx-4 bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">{viewingProperty.name || 'Property Details'}</h2>
              <button onClick={() => setViewingProperty(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6 text-sm">
              {getPropertyImageUrls(viewingProperty).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {getPropertyImageUrls(viewingProperty).map((url) => (
                    <img
                      key={url}
                      src={url}
                      alt={viewingProperty.name || 'Property'}
                      className="h-36 w-full rounded-lg object-cover border border-gray-100"
                    />
                  ))}
                </div>
              )}

              <p className="text-gray-600">{viewingProperty.description || 'No description added.'}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium uppercase text-gray-400">Location</div>
                  <div className="mt-1 text-gray-800">{viewingProperty.location || viewingProperty.address || '-'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-gray-400">Address</div>
                  <div className="mt-1 text-gray-800">{viewingProperty.address || '-'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-gray-400">Category</div>
                  <div className="mt-1 text-gray-800">{joinNames(viewingProperty.property_categories || viewingProperty.categories)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-gray-400">Type</div>
                  <div className="mt-1 text-gray-800">{joinNames(viewingProperty.property_types || viewingProperty.types)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-gray-400">Status</div>
                  <div className="mt-1 text-gray-800">{getPropertyStatusLabel(viewingProperty)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-gray-400">Approval</div>
                  <div className="mt-1 text-gray-800">{viewingProperty.is_approved === true ? 'Approved' : viewingProperty.is_approved === false ? 'Rejected' : 'Pending'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-gray-400">Amount</div>
                  <div className="mt-1 text-gray-800">{formatCurrency(viewingProperty.amount)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-gray-400">Total Amount</div>
                  <div className="mt-1 text-gray-800">{formatCurrency(viewingProperty.total_amount)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-gray-400">Commission</div>
                  <div className="mt-1 text-gray-800">{formatValue(viewingProperty.commission_percentage, '%')}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-gray-400">Cent / Sq Ft</div>
                  <div className="mt-1 text-gray-800">
                    {[
                      viewingProperty.per_cent ? `Per cent: ${formatCurrency(viewingProperty.per_cent)}` : null,
                      `Area: ${getAreaDisplay(viewingProperty)}`,
                    ].filter(Boolean).join(' | ') || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-gray-400">Rooms</div>
                  <div className="mt-1 text-gray-800">
                    {[
                      viewingProperty.bhk ? `${viewingProperty.bhk} BHK` : null,
                      viewingProperty.no_of_bedrooms ? `${viewingProperty.no_of_bedrooms} bedrooms` : null,
                      viewingProperty.no_of_bathrooms ? `${viewingProperty.no_of_bathrooms} bathrooms` : null,
                      viewingProperty.no_of_kitchen ? `${viewingProperty.no_of_kitchen} kitchen` : null,
                      viewingProperty.no_of_halls ? `${viewingProperty.no_of_halls} halls` : null,
                    ].filter(Boolean).join(', ') || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-gray-400">Featured</div>
                  <div className="mt-1 text-gray-800">{isPropertyFeatured(viewingProperty) ? 'Yes' : 'No'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-gray-400">Amenities</div>
                  <div className="mt-1 text-gray-800">{joinNames(viewingProperty.amenities)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-gray-400">Facilities</div>
                  <div className="mt-1 text-gray-800">{joinNames(viewingProperty.facilities)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-gray-400">Videos</div>
                  <div className="mt-1 text-gray-800">{Array.isArray(viewingProperty.property_videos) ? viewingProperty.property_videos.length : 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative z-10 w-full max-w-6xl mx-4 bg-gray-50 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
            <CreateProperty onSuccess={handleCreateSuccess} onCancel={() => setModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
