import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Package, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { getDonations, createDelivery, getShelter } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ShelterDashboard() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [shelterProfile, setShelterProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(null);

  const fetchData = async () => {
    if (!user || !user.id) return;
    try {
      const [donationsData, profileData] = await Promise.all([
        getDonations(),
        getShelter(user.id)
      ]);
      setDonations(donationsData);
      setShelterProfile(profileData);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAcceptDonation = async (donation) => {
    setAccepting(donation.id);
    try {
      await createDelivery({
        donation_id: donation.id,
        shelter_id: user.id,
        pickup_address: donation.pickup_address,
        dropoff_address: shelterProfile?.address || "Shelter Address Unknown",
        pickup_latitude: donation.latitude,
        pickup_longitude: donation.longitude,
        dropoff_latitude: shelterProfile?.latitude || 0,
        dropoff_longitude: shelterProfile?.longitude || 0
      });
      await fetchData();
    } catch (err) {
      alert("Failed to accept donation.");
    } finally {
      setAccepting(null);
    }
  };

  // Safe defaults if shelterProfile is missing
  const shelterName = shelterProfile?.name || shelterProfile?.organization_name || "Your Shelter";
  const currentCapacity = shelterProfile?.current_capacity || 0;
  const maxCapacity = shelterProfile?.max_capacity || 100;
  const capacityPercent = Math.min(Math.round((currentCapacity / maxCapacity) * 100), 100);

  // Filter donations dynamically based on the logged-in shelter
  const availableFood = donations.filter(d => ['MATCHED', 'POSTED'].includes(d.status) && (d.matched_shelter_id === user?.id || !d.matched_shelter_id));
  const receivedFood = donations.filter(d => d.status === 'DELIVERED' && d.matched_shelter_id === user?.id);
  const activeRequests = donations.filter(d => ['DRIVER_ASSIGNED', 'DRIVER_ACCEPTED', 'PICKUP_STARTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(d.status) && d.matched_shelter_id === user?.id);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 flex justify-center items-center h-64">
        <div className="text-slate-500 animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-brand-charcoal">Shelter Dashboard</h1>
          <p className="text-brand-charcoal opacity-70">Manage incoming food donations for {shelterName}</p>
        </div>
        <Link 
          to="/shelter/history" 
          className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition shadow-sm"
        >
          View Full History
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-8">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<Home />} title="Available Capacity" value={`${maxCapacity - currentCapacity} kg`} color="text-brand-green" />
        <StatCard icon={<Package />} title="Food Received" value={`${receivedFood.length}`} color="text-blue-500" />
        <StatCard icon={<Clock />} title="Active Requests" value={activeRequests.length} color="text-brand-orange" />
        <StatCard icon={<CheckCircle2 />} title="Donations Matched" value={availableFood.length} color="text-brand-emerald" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_0_rgba(15,23,42,0.05)] border border-slate-200 mb-8">
        <h2 className="text-xl font-bold mb-4 font-display">Shelter Capacity</h2>
        <div className="flex justify-between text-sm mb-2 font-bold text-slate-600">
          <span>{currentCapacity} kg used</span>
          <span>{maxCapacity} kg max</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-4">
          <div className={`h-4 rounded-full ${capacityPercent > 90 ? 'bg-red-500' : 'bg-brand-green'}`} style={{ width: `${capacityPercent}%` }}></div>
        </div>
        <p className="text-xs text-right mt-1 text-slate-400">{capacityPercent}% full</p>
      </div>

      <h2 className="text-xl font-bold mb-4 font-display">Available Food (Matched to You)</h2>
      
      {availableFood.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-[0_1px_3px_0_rgba(15,23,42,0.05)] border border-slate-200 mb-8">
          <Package className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500 font-medium">No new food matches available right now.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {availableFood.map(donation => (
          <div key={donation.id} className="bg-white p-6 rounded-xl shadow-[0_1px_3px_0_rgba(15,23,42,0.05)] border border-brand-green relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-brand-green text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              {donation.match_score || 95}% MATCH
            </div>
            
            <h3 className="font-bold text-xl mb-1 text-brand-charcoal">{donation.food_name}</h3>
            <p className="text-sm font-semibold text-slate-600 mb-4">{donation.quantity} {donation.unit} • {donation.food_category}</p>
            
            <div className="space-y-2 mb-6">
              <div className="flex gap-2 text-sm text-slate-600">
                <MapPin size={16} className="text-brand-green" /> <span>{donation.pickup_address || "Pickup address pending"}</span>
              </div>
              <div className="flex gap-2 text-sm text-slate-600">
                <Clock size={16} className="text-brand-orange" /> <span>Safe until: {donation.expiry_time ? new Date(donation.expiry_time).toLocaleTimeString() : 'N/A'}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => handleAcceptDonation(donation)}
                disabled={accepting === donation.id}
                className="flex-1 bg-brand-green text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-600 active:scale-[0.98] transition-all flex justify-center items-center min-h-[48px] shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {accepting === donation.id ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Accept Donation'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold mb-4 font-display">Incoming & Received Food</h2>
      <div className="bg-white rounded-xl shadow-[0_1px_3px_0_rgba(15,23,42,0.05)] border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-sans">
            <tr>
              <th className="p-4 font-semibold">Food</th>
              <th className="p-4 font-semibold">Quantity</th>
              <th className="p-4 font-semibold">Date</th>
              <th className="p-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {[...activeRequests, ...receivedFood].map(donation => (
              <tr key={donation.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-brand-charcoal">{donation.food_name}</td>
                <td className="p-4 text-slate-600">{donation.quantity} {donation.unit}</td>
                <td className="p-4 text-slate-600">{new Date(donation.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <div className="flex flex-col gap-2 items-start">
                    <span className={`px-2.5 py-1 text-xs rounded-full font-bold ${
                      donation.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-brand-sky/10 text-brand-sky'
                    }`}>
                      {donation.status.replace(/_/g, ' ')}
                    </span>
                    {donation.driver_incentive > 0 && (
                      <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md shadow-sm">
                        DRIVER INCENTIVE: <span className="text-sm tracking-widest ml-1">₹{donation.driver_incentive}</span>
                      </div>
                    )}
                    {donation.dropoff_otp && donation.status === 'OUT_FOR_DELIVERY' && (
                      <div className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md shadow-sm">
                        OTP FOR DRIVER: <span className="text-sm tracking-widest ml-1">{donation.dropoff_otp}</span>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {activeRequests.length === 0 && receivedFood.length === 0 && (
          <div className="p-12 text-center text-slate-500 font-medium">No incoming or received deliveries found.</div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color = "text-brand-charcoal" }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_0_rgba(15,23,42,0.05)] border border-slate-200 flex items-center gap-4 transition-transform hover:-translate-y-1">
      <div className={`p-4 bg-slate-50 rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold font-display text-brand-charcoal">{value}</p>
      </div>
    </div>
  );
}
