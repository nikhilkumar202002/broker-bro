import { useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiClock, FiHome, FiList, FiMapPin, FiStar, FiXCircle } from 'react-icons/fi';
import { getProperties } from '../../services/api';

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

const getPayloadTotal = (response) => {
  const { items, pagination } = getPropertiesPayload(response);
  return pagination?.total ?? pagination?.count ?? pagination?.total_count ?? items.length;
};

const getPropertyId = (property) => property?.id ?? property?._id;

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

const statusStyles = {
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Draft: 'bg-amber-50 text-amber-700 border-amber-200',
  Rejected: 'bg-red-50 text-red-700 border-red-200',
  Sold: 'bg-gray-50 text-gray-700 border-gray-200',
};

export default function Dashboard() {
  const [summary, setSummary] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const [recentProperties, setRecentProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const [allRes, approvedRes, pendingRes, rejectedRes] = await Promise.all([
        getProperties({ page: 1, limit: 8 }),
        getProperties({ page: 1, limit: 1, is_approved: true }),
        getProperties({ page: 1, limit: 1, is_approved: null }),
        getProperties({ page: 1, limit: 1, is_approved: false }),
      ]);

      const { items, pagination } = getPropertiesPayload(allRes);

      setRecentProperties(items);
      setSummary({
        total: pagination?.total ?? pagination?.count ?? pagination?.total_count ?? items.length,
        approved: getPayloadTotal(approvedRes),
        pending: getPayloadTotal(pendingRes),
        rejected: getPayloadTotal(rejectedRes),
      });
    } catch (e) {
      console.error('Failed to load dashboard', e);
      setError('Failed to load dashboard details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboard();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const statusCards = useMemo(
    () => [
      {
        title: 'Total Properties',
        value: summary.total,
        icon: FiHome,
        detail: 'All listings in the system',
        className: 'bg-blue-50 text-blue-700',
      },
      {
        title: 'Approved',
        value: summary.approved,
        icon: FiCheckCircle,
        detail: 'Ready for customers',
        className: 'bg-emerald-50 text-emerald-700',
      },
      {
        title: 'Pending Review',
        value: summary.pending,
        icon: FiClock,
        detail: 'Waiting for approval',
        className: 'bg-amber-50 text-amber-700',
      },
      {
        title: 'Rejected',
        value: summary.rejected,
        icon: FiXCircle,
        detail: 'Needs correction',
        className: 'bg-red-50 text-red-700',
      },
    ],
    [summary]
  );

  const featuredCount = recentProperties.filter(isPropertyFeatured).length;
  const activeListings = recentProperties.filter((property) => getPropertyStatusLabel(property) !== 'Rejected').length;
  const approvalRows = statusCards.slice(1).map((item) => ({
    ...item,
    percent: summary.total > 0 ? Math.round((item.value / summary.total) * 100) : 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500">Live property status, approval counts, and recent listing details.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statusCards.map((stat) => (
          <div key={stat.title} className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <div className="mt-2 text-3xl font-semibold text-gray-900">
                  {loading ? '...' : stat.value}
                </div>
              </div>
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${stat.className}`}>
                <stat.icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-sm text-gray-500">{stat.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Approval Status</h2>
            <FiList className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-5 space-y-4">
            {approvalRows.map((row) => (
              <div key={row.title}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{row.title}</span>
                  <span className="text-gray-500">{loading ? '...' : `${row.value} (${row.percent}%)`}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${
                      row.title === 'Approved'
                        ? 'bg-emerald-500'
                        : row.title === 'Pending Review'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${row.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Listing Snapshot</h2>
            <FiStar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-sm font-medium text-gray-500">Recent Loaded</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{loading ? '...' : recentProperties.length}</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-sm font-medium text-gray-500">Featured</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{loading ? '...' : featuredCount}</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-sm font-medium text-gray-500">Visible Listings</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{loading ? '...' : activeListings}</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Snapshot values are based on the most recent listings returned by the property API.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Recent Listings</h2>
          <span className="text-sm text-gray-500">{summary.total} total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Property</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Type</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Price</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Area</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-gray-500">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td className="px-5 py-8 text-center text-sm text-gray-400" colSpan={6}>
                    Loading dashboard details...
                  </td>
                </tr>
              ) : recentProperties.length === 0 ? (
                <tr>
                  <td className="px-5 py-8 text-center text-sm text-gray-400" colSpan={6}>
                    No recent properties found.
                  </td>
                </tr>
              ) : (
                recentProperties.map((property) => {
                  const statusLabel = getPropertyStatusLabel(property);
                  const propertyAmount = property.total_amount ?? property.amount;
                  const createdDate = property.createdAt || property.created_at
                    ? new Date(property.createdAt ?? property.created_at).toLocaleDateString()
                    : '-';

                  return (
                    <tr key={getPropertyId(property)} className="hover:bg-gray-50">
                      <td className="px-5 py-4 align-top">
                        <div className="min-w-60">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{property.name || 'Untitled property'}</span>
                            {isPropertyFeatured(property) && <FiStar className="h-4 w-4 shrink-0 fill-current text-amber-500" />}
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                            <FiMapPin className="h-3.5 w-3.5 shrink-0" />
                            <span>{property.location || property.address || '-'}</span>
                          </div>
                          <div className="mt-1 text-xs text-gray-400">{getPropertyId(property)}</div>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top text-sm text-gray-600">
                        <div>{joinNames(property.property_categories || property.categories)}</div>
                        <div className="mt-1 text-xs text-gray-400">{joinNames(property.property_types || property.types)}</div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[statusLabel] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top text-sm font-semibold text-gray-900">
                        {formatCurrency(propertyAmount)}
                      </td>
                      <td className="px-5 py-4 align-top text-sm text-gray-600">
                        {getAreaDisplay(property)}
                      </td>
                      <td className="px-5 py-4 text-right align-top text-sm text-gray-500">
                        {createdDate}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
