import { useEffect, useState } from 'react';
import { getCountries, getDistricts, getStates } from '../../services/api';

const tabs = [
  { key: 'countries', label: 'Country' },
  { key: 'states', label: 'State' },
  { key: 'districts', label: 'District' },
];

const endpoints = {
  countries: getCountries,
  states: getStates,
  districts: getDistricts,
};

const listKeys = {
  countries: ['countries', 'country'],
  states: ['states', 'state'],
  districts: ['districts', 'district'],
};

const titleMap = {
  countries: 'Countries',
  states: 'States',
  districts: 'Districts',
};

const getId = (item) => item?.id ?? item?._id;

const pickList = (payload, activeTab) => {
  const keys = listKeys[activeTab];

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const getPayload = (response, activeTab) => {
  const payload = response?.data?.data ?? response?.data ?? {};

  return {
    items: pickList(payload, activeTab),
    pagination: payload?.pagination ?? null,
  };
};

const getParentName = (item) =>
  item?.country?.name ??
  item?.country_id?.name ??
  item?.state?.name ??
  item?.state_id?.name ??
  '-';

const getStatus = (item) => item?.status || 'Active';

const getStatusClass = (status) => {
  const normalizedStatus = String(status).toLowerCase();

  return normalizedStatus === 'active'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-gray-50 text-gray-700 border-gray-200';
};

export default function World() {
  const [activeTab, setActiveTab] = useState('countries');
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchItems = async (tab = activeTab, page = 1) => {
    setLoading(true);
    setError('');

    try {
      const response = await endpoints[tab]({ page, limit: 10 });
      const { items: listItems, pagination: paginationData } = getPayload(response, tab);

      setItems(listItems);
      setPagination(paginationData);
    } catch (err) {
      setError(`Failed to load ${titleMap[tab].toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(activeTab, 1);
  }, [activeTab]);

  const currentPage = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? items.length;
  const perPage = pagination?.limit ?? 10;
  const startIndex = (currentPage - 1) * perPage;
  const showParentColumn = activeTab !== 'countries';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">World</h1>
          <p className="text-sm text-gray-500 mt-1">Manage country, state, and district location data.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sl No</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                {showParentColumn && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {activeTab === 'states' ? 'Country' : 'State / Country'}
                  </th>
                )}
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={showParentColumn ? 4 : 3} className="px-6 py-12 text-center text-gray-500">
                    Loading {titleMap[activeTab].toLowerCase()}...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={showParentColumn ? 4 : 3} className="px-6 py-12 text-center text-red-500">{error}</td>
                </tr>
              ) : items.length > 0 ? (
                items.map((item, index) => (
                  <tr key={getId(item) ?? index} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">{startIndex + index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                    {showParentColumn && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getParentName(item)}</td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusClass(getStatus(item))}`}>
                        {getStatus(item)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={showParentColumn ? 4 : 3} className="px-6 py-12 text-center text-gray-500">
                    No {titleMap[activeTab].toLowerCase()} found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">Page {currentPage} of {totalPages} - {total} total</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchItems(activeTab, currentPage - 1)}
              disabled={!pagination.prevPageUrl}
              className="px-3 py-1 text-sm rounded bg-gray-100 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => fetchItems(activeTab, currentPage + 1)}
              disabled={!pagination.nextPageUrl}
              className="px-3 py-1 text-sm rounded bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
