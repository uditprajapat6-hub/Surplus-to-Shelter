import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDonation } from '../services/api';
import { MapPin, Clock, ArrowLeft, CheckCircle2, User, Truck, Box } from 'lucide-react';

export default function DonationDetails() {
  const { id } = useParams();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getDonation(id);
        setDonation(data);
      } catch (err) {
        setError("Unable to load donation details.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) return <div className="p-12 text-center text-gray-500">Loading details...</div>;
  if (error || !donation) return <div className="p-12 text-center text-red-500">{error || "Donation not found"}</div>;

  const STATUS_STEPS = [
    { key: 'POSTED', label: 'Posted' },
    { key: 'MATCHED', label: 'Matched' },
    { key: 'DRIVER_ASSIGNED', label: 'Driver Assigned' },
    { key: 'PICKED_UP', label: 'Picked Up' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'DELIVERED', label: 'Delivered' }
  ];

  const currentStatusIndex = STATUS_STEPS.findIndex(s => s.key === donation.status);
  
  return (
    <div className="max-w-4xl mx-auto p-6 my-8 bg-white rounded-xl shadow-sm border border-gray-100">
      <Link to="/donor" className="text-gray-500 hover:text-brand-green flex items-center gap-2 mb-6 text-sm font-semibold">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>
      
      <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-brand-charcoal mb-2">{donation.food_name}</h1>
          <p className="text-gray-600 flex items-center gap-2">
            <span className="font-semibold text-gray-800">{donation.quantity} {donation.unit}</span> • {donation.food_category}
          </p>
        </div>
        <div className="text-right">
          <span className={`px-4 py-2 uppercase rounded-full text-sm font-bold inline-block ${
            donation.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 
            donation.status === 'EXPIRED' ? 'bg-red-100 text-red-700' :
            'bg-brand-light text-brand-green'
          }`}>
            {donation.status.replace(/_/g, ' ')}
          </span>
          <p className="text-xs text-gray-400 mt-2">Posted on {new Date(donation.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-10 p-6 bg-gray-50 rounded-xl">
        <h3 className="font-bold text-gray-700 mb-6">Status Timeline</h3>
        <div className="flex justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 left-0 h-1 bg-brand-green -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${Math.max(0, (currentStatusIndex / (STATUS_STEPS.length - 1)) * 100)}%` }}
          ></div>
          
          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = currentStatusIndex >= idx;
            const isCurrent = currentStatusIndex === idx;
            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${
                  isCompleted ? 'bg-brand-green border-brand-green text-white' : 
                  'bg-white border-gray-300 text-gray-400'
                }`}>
                  {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                </div>
                <span className={`text-xs font-semibold ${isCurrent ? 'text-brand-green' : 'text-gray-500'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
            <Box size={18} className="text-brand-green"/> Details
          </h3>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Pickup Address</p>
              <p className="font-semibold">{donation.pickup_address}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Safe Until</p>
              <p className="font-semibold text-brand-orange">{new Date(donation.expiry_time).toLocaleString()}</p>
            </div>
            {donation.allergens && donation.allergens.length > 0 && (
              <div>
                <p className="text-gray-500 mb-1">Allergens</p>
                <p className="font-semibold">{donation.allergens.join(', ')}</p>
              </div>
            )}
            {donation.description && (
              <div>
                <p className="text-gray-500 mb-1">Description</p>
                <p className="font-semibold">{donation.description}</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
            <Truck size={18} className="text-blue-500"/> Logistics
          </h3>
          <div className="space-y-4 text-sm bg-blue-50/50 p-4 rounded-lg">
            {donation.matched_shelter_id ? (
              <>
                <div>
                  <p className="text-gray-500 mb-1">Recipient Shelter</p>
                  <p className="font-bold text-blue-700">Hope Shelter Jaipur</p>
                </div>
                {donation.match_score && (
                  <div>
                    <p className="text-gray-500 mb-1">Match Compatibility</p>
                    <p className="font-semibold">{Math.round(donation.match_score * 100)}% Match</p>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-blue-100">
                  <p className="text-gray-500 mb-1">Driver</p>
                  <p className="font-semibold">{currentStatusIndex >= 2 ? "Rahul (Assigned)" : "Pending Assignment"}</p>
                </div>
              </>
            ) : (
              <p className="text-gray-500 italic py-4">Waiting for the smart matching engine to select the best shelter...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
