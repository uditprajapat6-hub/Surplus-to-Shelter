import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Utensils, Clock, CheckCircle } from 'lucide-react';
import { getDonations } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DonorDashboard() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDonations() {
      try {
        const data = await getDonations();
        setDonations(data);
      } catch (err) {
        setError('Failed to load donations. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      fetchDonations();
    }
  }, [user]);

  const activeDonations = donations.filter(d => !['DELIVERED', 'EXPIRED', 'CANCELLED'].includes(d.status));
  const completedDonations = donations.filter(d => d.status === 'DELIVERED');
  
  // Real metric calculated securely from the active DB rows belonging to this user
  const foodRescued = completedDonations.reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0);

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-charcoal font-display">Donor Dashboard</h1>
          <p className="text-brand-charcoal opacity-70">Manage your surplus food donations, {user.name || 'Donor'}</p>
        </div>
        <div className="flex gap-3">
          <Link 
            to="/donor/history" 
            className="bg-white text-brand-green border border-brand-green px-6 py-3 rounded-lg font-bold hover:bg-emerald-50 active:scale-[0.98] transition-all shadow-sm flex items-center gap-2"
          >
            History
          </Link>
          <Link 
            to="/donor/new" 
            className="bg-brand-green text-white px-6 py-3 rounded-lg font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-md flex items-center gap-2"
          >
            <Package size={20} />
            Post Surplus Food
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<Utensils />} title="Total Donations" value={donations.length} color="text-brand-charcoal" />
        <StatCard icon={<Clock />} title="Active" value={activeDonations.length} color="text-brand-orange" />
        <StatCard icon={<CheckCircle />} title="Completed" value={completedDonations.length} color="text-brand-green" />
        <StatCard icon={<Package />} title="Food Rescued" value={`${foodRescued} kg`} color="text-brand-emerald" />
      </div>

      <h2 className="text-xl font-bold mb-4 font-display">Your Recent Donations</h2>
      
      {loading && (
        <div className="flex justify-center items-center h-32">
          <div className="text-slate-500 animate-pulse">Loading donations...</div>
        </div>
      )}
      
      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}
      
      {!loading && !error && donations.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-[0_1px_3px_0_rgba(15,23,42,0.05)] border border-slate-200">
          <Package className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500 font-medium mb-4">You haven't posted any donations yet.</p>
          <Link 
            to="/donor/new" 
            className="inline-flex bg-brand-green text-white px-6 py-2.5 rounded-lg font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-sm items-center gap-2"
          >
            Create your first donation
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {donations.map(donation => (
          <div key={donation.id} className="bg-white p-6 rounded-xl shadow-[0_1px_3px_0_rgba(15,23,42,0.05)] border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-brand-charcoal font-display line-clamp-1 pr-2">{donation.food_name}</h3>
                <span className={`px-2.5 py-1 text-[10px] uppercase rounded-full font-bold whitespace-nowrap tracking-wider ${
                  donation.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 
                  donation.status === 'MATCHED' ? 'bg-brand-sky/20 text-brand-sky' :
                  ['DRIVER_ASSIGNED', 'ACCEPTED', 'PICKUP_STARTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(donation.status) ? 'bg-indigo-100 text-indigo-700' :
                  donation.status === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                  donation.status === 'CANCELLED' ? 'bg-slate-100 text-slate-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {donation.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-1 font-medium">{donation.food_category}</p>
              <p className="text-base font-bold text-slate-800 mb-4">{donation.quantity} {donation.unit}</p>
              
              {/* Expiry / Safe Until Box */}
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg mb-5 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 mb-1.5 font-medium">
                  <Clock size={14} className="text-slate-400" /> Safe until: {donation.expiry_time ? new Date(donation.expiry_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                </div>
                {(() => {
                  if (!donation.expiry_time) return null;
                  const now = new Date();
                  const expiry = new Date(donation.expiry_time);
                  const diffMs = expiry - now;
                  if (diffMs <= 0 || donation.status === 'EXPIRED') {
                    return <p className="font-bold text-red-500 ml-5">EXPIRED</p>;
                  }
                  const diffHrs = Math.floor(diffMs / 3600000);
                  const diffMins = Math.floor((diffMs % 3600000) / 60000);
                  return <p className="font-bold text-brand-orange ml-5">Expires in {diffHrs}h {diffMins}m</p>;
                })()}
              </div>

              {donation.driver_incentive > 0 && (
                <div className="mb-4 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg text-center shadow-sm uppercase tracking-widest">
                  Driver Incentive / Delivery Reimbursement: <span className="text-sm ml-1 text-emerald-800">₹{donation.driver_incentive}</span>
                </div>
              )}

              {donation.pickup_otp && (
                <div className="mb-5 bg-indigo-50 border border-indigo-100 p-3 rounded-lg text-center shadow-inner">
                  <p className="text-[10px] text-indigo-500 font-bold uppercase mb-1 tracking-widest">Provide this OTP to driver</p>
                  <p className="text-3xl font-black text-indigo-700 font-display tracking-[0.2em]">{donation.pickup_otp}</p>
                </div>
              )}
            </div>
            
            <Link 
              to={`/donor/donations/${donation.id}`}
              className="w-full inline-flex justify-center items-center bg-slate-50 border border-slate-200 text-slate-700 font-bold py-2.5 rounded-lg hover:bg-slate-100 active:scale-[0.98] transition-all"
            >
              View Details
            </Link>
          </div>
        ))}
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
