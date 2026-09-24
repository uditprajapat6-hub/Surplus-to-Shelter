import React, { useState, useEffect } from 'react';
import { getDonations } from '../services/api';
import { Search, Filter, ChevronDown, ArrowUpDown } from 'lucide-react';

export default function DonorHistory() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    async function fetchDonations() {
      try {
        const data = await getDonations();
        setDonations(data);
      } catch (err) {
        setError('Unable to load donations. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchDonations();
  }, []);

  // Filtering logic
  const filteredDonations = donations.filter(d => {
    const matchesSearch = d.food_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  // Sorting logic
  const sortedDonations = [...filteredDonations].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  if (loading) return <div className="text-center p-12 text-gray-500">Loading donation history...</div>;
  if (error) return (
    <div className="text-center p-12">
      <p className="text-red-500 mb-4">{error}</p>
      <button onClick={() => window.location.reload()} className="bg-brand-green text-white px-4 py-2 rounded">Retry</button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-charcoal">Donation History</h1>
        <p className="text-brand-charcoal opacity-70">Review all your past and active surplus donations.</p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by food name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>

        <div className="flex gap-4">
          {/* Status Filter */}
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-10 pr-8 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
            >
              <option value="ALL">All Statuses</option>
              <option value="POSTED">Posted</option>
              <option value="MATCHED">Matched</option>
              <option value="DRIVER_ASSIGNED">Driver Assigned</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="EXPIRED">Expired</option>
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>

          {/* Sort */}
          <button 
            onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-semibold text-gray-700"
          >
            <ArrowUpDown size={16} />
            {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {sortedDonations.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No donations match your filters.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
              <tr>
                <th className="p-4 font-semibold">Food Name</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Quantity</th>
                <th className="p-4 font-semibold">Date Posted</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedDonations.map(donation => (
                <tr key={donation.id} className="border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer">
                  <td className="p-4 font-medium">{donation.food_name}</td>
                  <td className="p-4 text-gray-600">{donation.food_category}</td>
                  <td className="p-4 text-gray-600">{donation.quantity} {donation.unit}</td>
                  <td className="p-4 text-gray-500">{new Date(donation.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-[10px] uppercase rounded-full font-bold inline-block ${
                      donation.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 
                      donation.status === 'MATCHED' ? 'bg-blue-100 text-blue-700' :
                      donation.status === 'DRIVER_ASSIGNED' ? 'bg-indigo-100 text-indigo-700' :
                      donation.status === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {donation.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
