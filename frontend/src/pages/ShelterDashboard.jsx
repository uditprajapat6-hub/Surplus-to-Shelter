import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Package, CheckCircle2, Clock, MapPin, ChevronRight } from 'lucide-react';
import { getDonations, createDelivery } from '../services/api';

const MOCK_SHELTER_ID = "mock_shelter_1";

export default function ShelterDashboard() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(null);

  const fetchData = async () => {
    try {
      const data = await getDonations();
      setDonations(data);
    } catch (err) {
      setError('Failed to load donations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAcceptDonation = async (donation) => {
    setAccepting(donation.id);
    try {
      await createDelivery({
        donation_id: donation.id,
        shelter_id: MOCK_SHELTER_ID,
        driver_id: "auto_assigned_driver_1",
        pickup_address: donation.pickup_address,
        dropoff_address: "Hope Shelter (Main)", // Mock dropoff
        distance_km: donation.match_score ? 5.2 : 0 // Fallback
      });
      await fetchData();
    } catch (err) {
      alert("Failed to accept donation.");
    } finally {
      setAccepting(null);
    }
  };

  const availableFood = donations.filter(d => d.status === 'MATCHED' && (d.matched_shelter_id === MOCK_SHELTER_ID || !d.matched_shelter_id));
  const receivedFood = donations.filter(d => d.status === 'DELIVERED'); // In a real app, filter by shelter_id
  const activeRequests = donations.filter(d => ['DRIVER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(d.status));

  // Shelter Capacity Mock Data
  const currentCapacity = 120;
  const maxCapacity = 500;
  const capacityPercent = Math.round((currentCapacity / maxCapacity) * 100);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-brand-charcoal">Shelter Dashboard</h1>
          <p className="text-brand-charcoal opacity-70">Manage incoming food donations for Hope Shelter</p>
        </div>
        <Link 
          to="/shelter/history" 
          className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition shadow-sm"
        >
          View Full History
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<Home />} title="Available Capacity" value={`${maxCapacity - currentCapacity} kg`} color="text-brand-green" />
        <StatCard icon={<Package />} title="Food Received" value={`${receivedFood.length}`} color="text-blue-500" />
        <StatCard icon={<Clock />} title="Active Requests" value={activeRequests.length} color="text-brand-orange" />
        <StatCard icon={<CheckCircle2 />} title="Donations Matched" value={availableFood.length} color="text-brand-emerald" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-bold mb-4">Shelter Capacity</h2>
        <div className="flex justify-between text-sm mb-2 font-bold text-gray-600">
          <span>{currentCapacity} kg used</span>
          <span>{maxCapacity} kg max</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div className="bg-brand-green h-4 rounded-full" style={{ width: `${capacityPercent}%` }}></div>
        </div>
        <p className="text-xs text-right mt-1 text-gray-400">{capacityPercent}% full</p>
      </div>

      <h2 className="text-xl font-bold mb-4">Available Food (Matched to You)</h2>
      {loading && <p>Loading matches...</p>}
      
      {!loading && availableFood.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <Package className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">No new food matches available right now.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {availableFood.map(donation => (
          <div key={donation.id} className="bg-white p-6 rounded-xl shadow-sm border border-brand-green relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-brand-green text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              {donation.match_score}% MATCH
            </div>
            
            <h3 className="font-bold text-xl mb-1">{donation.food_name}</h3>
            <p className="text-sm font-semibold text-gray-600 mb-4">{donation.quantity} {donation.unit} • {donation.food_category}</p>
            
            <div className="space-y-2 mb-6">
              <div className="flex gap-2 text-sm text-gray-600">
                <MapPin size={16} /> <span>{donation.pickup_address}</span>
              </div>
              <div className="flex gap-2 text-sm text-gray-600">
                <Clock size={16} /> <span>Safe until: {new Date(donation.expiry_time).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => handleAcceptDonation(donation)}
                disabled={accepting === donation.id}
                className="flex-1 bg-brand-green text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition flex justify-center items-center gap-2"
              >
                {accepting === donation.id ? 'Accepting...' : 'Accept Donation'}
              </button>
              <button className="flex-1 bg-brand-light text-brand-green font-bold py-2 px-4 rounded-lg hover:bg-gray-100 transition">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold mb-4">Incoming & Received Food</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
            <tr>
              <th className="p-4 font-semibold">Food</th>
              <th className="p-4 font-semibold">Quantity</th>
              <th className="p-4 font-semibold">Date</th>
              <th className="p-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {[...activeRequests, ...receivedFood].map(donation => (
              <tr key={donation.id} className="border-b border-gray-50 last:border-0">
                <td className="p-4 font-medium">{donation.food_name}</td>
                <td className="p-4 text-gray-600">{donation.quantity} {donation.unit}</td>
                <td className="p-4 text-gray-600">{new Date(donation.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                    donation.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {donation.status.replace(/_/g, ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {activeRequests.length === 0 && receivedFood.length === 0 && (
          <div className="p-8 text-center text-gray-500">No incoming deliveries history.</div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color = "text-brand-charcoal" }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`p-4 bg-gray-50 rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
