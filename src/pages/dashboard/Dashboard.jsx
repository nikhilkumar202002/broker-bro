import React from 'react';

export default function Dashboard() {
  // Mock data for top statistics
  const stats = [
    { title: 'Total Properties', value: '1,248', trend: '+12%', trendUp: true, icon: '🏢' },
    { title: 'Active Rentals', value: '432', trend: '+5%', trendUp: true, icon: '🔑' },
    { title: 'Commercial Plots', value: '189', trend: '-2%', trendUp: false, icon: '🏗️' },
    { title: 'Total Revenue', value: '$4.2M', trend: '+18%', trendUp: true, icon: '📈' },
  ];

  // Mock data for a high-density recent activity table
  const recentProperties = [
    { id: '#P-001', name: 'Sunrise Tech Park', category: 'Commercial', status: 'Active', price: '$2.5M', date: 'May 6, 2026' },
    { id: '#P-002', name: 'Downtown Retail Space', category: 'Plot + Building', status: 'Pending', price: '$850k', date: 'May 5, 2026' },
    { id: '#P-003', name: 'Westside Residential Plot', category: 'Plot', status: 'Active', price: '$120k', date: 'May 4, 2026' },
    { id: '#P-004', name: 'Lakeview Apartments', category: 'Rental', status: 'Sold', price: '$3.2k/mo', date: 'May 2, 2026' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back. Here is what's happening with your properties today.</p>
        </div>
        <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Property
        </button>
      </div>

      {/* Stat Cards - Modern Glassmorphic / Soft UI feel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-xl">
                {stat.icon}
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={`font-medium flex items-center ${stat.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                {stat.trendUp ? (
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                ) : (
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" /></svg>
                )}
                {stat.trend}
              </span>
              <span className="text-gray-400 ml-2">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* High-Density Data Table Section */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Recent Listings</h2>
          <button className="text-sm text-blue-600 font-medium hover:text-blue-700">View all</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Added</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentProperties.map((property) => (
                <tr key={property.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{property.name}</span>
                      <span className="text-xs text-gray-500">{property.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{property.category}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                      ${property.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        property.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        'bg-gray-50 text-gray-700 border-gray-200'}`}
                    >
                      {property.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {property.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {property.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}