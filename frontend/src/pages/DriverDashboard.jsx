import React, { useState, useEffect } from 'react';
import { Truck, MapPin, CheckCircle2, ChevronRight, Navigation } from 'lucide-react';
import { getDeliveries, updateDeliveryStatus } from '../services/api';
import MapRoute from '../components/MapRoute';

const STATUS_FLOW = {
  'ASSIGNED': { next: 'ACCEPTED', label: 'Accept Delivery', color: 'bg-blue-500' },
  'ACCEPTED': { next: 'PICKED_UP', label: 'Mark Picked Up', color: 'bg-orange-500' },
  'PICKED_UP': { next: 'IN_TRANSIT', label: 'Start Transit', color: 'bg-purple-500' },
  'IN_TRANSIT': { next: 'DELIVERED', label: 'Mark Delivered', color: 'bg-brand-green' },
  'DELIVERED': { next: null, label: 'Completed', color: 'bg-gray-400' }
};

export default function DriverDashboard() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);

  const fetchDeliveries = async () => {
    try {
      const data = await getDeliveries();
      setDeliveries(data);
    } catch (err) {
      setError('Failed to load deliveries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleUpdateStatus = async (id, currentStatus) => {
    const nextStatus = STATUS_FLOW[currentStatus]?.next;
    if (!nextStatus) return;

    setUpdating(id);
    try {
      await updateDeliveryStatus(id, nextStatus);
      await fetchDeliveries(); // Refresh data
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const activeDeliveries = deliveries.filter(d => d.status !== 'DELIVERED');
  const completedDeliveries = deliveries.filter(d => d.status === 'DELIVERED');

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-charcoal">Driver Dashboard</h1>
        <p className="text-brand-charcoal opacity-70">Manage your pickups and deliveries</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon={<Truck />} title="Active Deliveries" value={activeDeliveries.length} color="text-brand-orange" />
        <StatCard icon={<CheckCircle2 />} title="Completed Today" value={completedDeliveries.length} color="text-brand-green" />
        <StatCard icon={<Navigation />} title="Total Km Driven" value={deliveries.reduce((acc, curr) => acc + (curr.distance_km || 0), 0).toFixed(1)} color="text-blue-500" />
      </div>

      <h2 className="text-xl font-bold mb-4">Current Assignments</h2>
      {loading && <p>Loading your route...</p>}
      {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>}
      
      {!loading && !error && activeDeliveries.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <Truck className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">No active deliveries assigned to you right now.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 mb-12">
        {activeDeliveries.map(delivery => (
          <DeliveryCard 
            key={delivery.id} 
            delivery={delivery} 
            onUpdate={() => handleUpdateStatus(delivery.id, delivery.status)}
            isUpdating={updating === delivery.id}
          />
        ))}
      </div>

      {completedDeliveries.length > 0 && (
        <>
          <h2 className="text-xl font-bold mb-4 text-gray-400">Completed Deliveries</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
            {completedDeliveries.map(delivery => (
              <div key={delivery.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-600">Donation #{delivery.donation_id.slice(-6)}</span>
                  <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full font-bold">DELIVERED</span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-1"><MapPin size={14} className="inline mr-1"/> {delivery.dropoff_address}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DeliveryCard({ delivery, onUpdate, isUpdating }) {
  const flowInfo = STATUS_FLOW[delivery.status];

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col md:flex-row">
      <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Delivery Ticket</span>
            <h3 className="font-bold text-lg">#{delivery.id.slice(-8).toUpperCase()}</h3>
          </div>
          <span className={`px-3 py-1 text-xs rounded-full font-bold text-white ${flowInfo?.color || 'bg-gray-500'}`}>
            {delivery.status.replace('_', ' ')}
          </span>
        </div>

        <div className="space-y-4 relative">
          <div className="flex gap-3">
            <div className="mt-1 bg-orange-100 p-1.5 rounded-full text-orange-600 h-fit"><MapPin size={16}/></div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Pickup</p>
              <p className="font-medium">{delivery.pickup_address}</p>
            </div>
          </div>
          
          <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-gray-200"></div>

          <div className="flex gap-3">
            <div className="mt-1 bg-brand-light p-1.5 rounded-full text-brand-green h-fit"><MapPin size={16}/></div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Dropoff</p>
              <p className="font-medium">{delivery.dropoff_address}</p>
            </div>
          </div>
        </div>

        {/* Map visualization */}
        {delivery.status !== 'DELIVERED' && (
          <MapRoute delivery={delivery} />
        )}

        {/* Delivery Proof (Only when out for delivery) */}
        {delivery.status === 'OUT_FOR_DELIVERY' && (
          <div className="mt-4 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
            <p className="text-sm font-bold text-gray-700 mb-2">Delivery Proof Required</p>
            <div className="flex gap-2 mb-2">
              <button className="flex-1 bg-white border border-gray-300 text-gray-600 text-xs py-2 rounded shadow-sm hover:bg-gray-50 flex justify-center items-center gap-1">
                <Navigation size={14}/> Upload Photo
              </button>
            </div>
            <textarea 
              placeholder="Optional delivery note (e.g. Left at front desk)" 
              className="w-full text-xs p-2 border border-gray-200 rounded resize-none focus:outline-none focus:border-brand-green"
              rows="2"
            ></textarea>
          </div>
        )}
      </div>
      
      <div className="p-6 bg-gray-50 md:w-64 flex flex-col justify-center items-center text-center">
        <div className="mb-4">
          <p className="text-3xl font-black text-brand-charcoal">{delivery.distance_km} <span className="text-sm font-normal text-gray-500">km</span></p>
          <p className="text-xs text-gray-500 font-bold uppercase">Est. Distance</p>
        </div>
        
        {flowInfo?.next && (
          <button 
            onClick={onUpdate}
            disabled={isUpdating}
            className={`w-full text-white font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition flex items-center justify-center gap-2 ${flowInfo.color}`}
          >
            {isUpdating ? 'Updating...' : <>{flowInfo.label} <ChevronRight size={18} /></>}
          </button>
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
