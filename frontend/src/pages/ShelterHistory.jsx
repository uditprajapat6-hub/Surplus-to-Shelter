import React, { useState, useEffect } from 'react';
import { getDonations } from '../services/api';
import { Filter, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ShelterHistory() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  // Filters: All, Pending, Accepted, Received
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    async function fetchDonations() {
      try {
        const data = await getDonations();
        setDonations(data);
      } catch (err) {
        setError('Unable to load history. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchDonations();
  }, []);

  // Shelter history specifically views donations assigned to them
  const shelterDonations = donations.filter(d => 
    d.matched_shelter_id === user?.id || (d.status !== 'POSTED' && d.matched_shelter_id === user?.id)
  );

  const filteredDonations = shelterDonations.filter(d => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING') return d.status === 'MATCHED';
    if (statusFilter === 'ACCEPTED') return ['DRIVER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(d.status);
    if (statusFilter === 'RECEIVED') return d.status === 'DELIVERED';
    return true;
  });

  const sortedDonations = [...filteredDonations].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (loading) return <div className="text-center p-12 text-gray-500">Loading history...</div>;
  if (error) return <div className="text-center p-12 text-red-500">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-brand-charcoal">Food History</h1>
          <p className="text-brand-charcoal opacity-70">Log of all surplus food offered and received.</p>
        </div>
        
        {/* Status Filter */}
        <div className="relative">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-10 pr-8 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green font-semibold text-gray-700"
          >
            <option value="ALL">All Records</option>
            <option value="PENDING">Pending (Matched)</option>
            <option value="ACCEPTED">Accepted (In Transit)</option>
            <option value="RECEIVED">Received (Delivered)</option>
          </select>
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {sortedDonations.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No history found for this filter.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
              <tr>
                <th className="p-4 font-semibold">Food</th>
                <th className="p-4 font-semibold">Quantity</th>
                <th className="p-4 font-semibold">Donor / Driver</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedDonations.map(donation => (
                <tr key={donation.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-medium">{donation.food_name}</td>
                  <td className="p-4 text-gray-600">{donation.quantity} {donation.unit}</td>
                  <td className="p-4 text-gray-600">
                    <div>Anonymous Donor</div>
                    <div className="text-xs text-gray-400">Driver {donation.status !== 'MATCHED' && donation.status !== 'POSTED' ? 'Assigned' : 'Pending'}</div>
                  </td>
                  <td className="p-4 text-gray-500">{new Date(donation.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-[10px] uppercase rounded-full font-bold inline-block ${
                      donation.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 
                      donation.status === 'MATCHED' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {donation.status === 'MATCHED' ? 'PENDING' : 
                       donation.status === 'DELIVERED' ? 'RECEIVED' : 'IN TRANSIT'}
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
