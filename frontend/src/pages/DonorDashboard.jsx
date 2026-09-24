import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Utensils, Clock, CheckCircle } from 'lucide-react';
import { getDonations } from '../services/api';

export default function DonorDashboard() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDonations() {
      try {
        const data = await getDonations();
        setDonations(data);
      } catch (err) {
        setError('Failed to load donations. Please ensure the backend is running.');
      } finally {
        setLoading(false);
      }
    }
    fetchDonations();
  }, []);

  const activeDonations = donations.filter(d => d.status === 'POSTED' || d.status === 'MATCHED' || d.status === 'IN_TRANSIT');
  const completedDonations = donations.filter(d => d.status === 'DELIVERED');
  
  // Calculate total food rescued (mock metric for now based on quantity)
  const foodRescued = completedDonations.reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-brand-charcoal">Donor Dashboard</h1>
          <p className="text-brand-charcoal opacity-70">Manage your surplus food donations</p>
        </div>
        <Link 
          to="/donor/new" 
          className="bg-brand-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition shadow-md flex items-center gap-2"
        >
          <Package size={20} />
          Post Surplus Food
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<Utensils />} title="Total Donations" value={donations.length} />
        <StatCard icon={<Clock />} title="Active" value={activeDonations.length} color="text-brand-orange" />
        <StatCard icon={<CheckCircle />} title="Completed" value={completedDonations.length} color="text-brand-green" />
        <StatCard icon={<Package />} title="Food Rescued" value={`${foodRescued} kg`} color="text-brand-emerald" />
      </div>

      <h2 className="text-xl font-bold mb-4">Your Recent Donations</h2>
      {loading && <p>Loading donations...</p>}
      {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>}
      
      {!loading && !error && donations.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <Package className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">You haven't posted any donations yet.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {donations.map(donation => (
          <div key={donation.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg">{donation.food_name}</h3>
              <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                donation.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 
                donation.status === 'MATCHED' ? 'bg-blue-100 text-blue-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {donation.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">Category: {donation.food_category}</p>
            <p className="text-sm font-semibold mb-4">{donation.quantity} {donation.unit}</p>
            
            {donation.status === 'POSTED' && (
              <Link 
                to={`/donor/matches/${donation.id}`} 
                className="block w-full text-center bg-brand-light text-brand-green border border-brand-green font-semibold py-2 rounded-lg hover:bg-brand-green hover:text-white transition"
              >
                Find Recipient
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color = "text-brand-charcoal" }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`p-4 bg-brand-light rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
