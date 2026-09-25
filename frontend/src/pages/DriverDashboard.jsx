import React, { useState, useEffect } from 'react';
import { Truck, MapPin, CheckCircle2, ChevronRight, Navigation, X } from 'lucide-react';
import { getDeliveries, updateDeliveryStatus } from '../services/api';
import DeliveryMap from '../components/DeliveryMap';
import { useAuth } from '../context/AuthContext';

const STATUS_FLOW = {
  'ASSIGNED': { next: 'ACCEPTED', label: 'Accept Delivery', color: 'bg-brand-sky' },
  'ACCEPTED': { next: 'PICKUP_STARTED', label: 'Start Pickup', color: 'bg-blue-500' },
  'PICKUP_STARTED': { next: 'PICKED_UP', label: 'Mark Picked Up', color: 'bg-orange-500' },
  'PICKED_UP': { next: 'OUT_FOR_DELIVERY', label: 'Start Transit', color: 'bg-purple-500' },
  'OUT_FOR_DELIVERY': { next: 'DELIVERED', label: 'Mark Delivered', color: 'bg-brand-green' },
  'DELIVERED': { next: null, label: 'Completed', color: 'bg-slate-400' }
};

export default function DriverDashboard() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);

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
  
  // Track Driver GPS
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => setDriverLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.error("Geolocation error:", err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const handleUpdateStatus = async (id, currentStatus, overrideNextStatus = null) => {
    const nextStatus = overrideNextStatus || STATUS_FLOW[currentStatus]?.next;
    if (!nextStatus) return;

    let otp = null;
    if (nextStatus === 'PICKED_UP') {
      otp = window.prompt("Please enter the 4-digit Pickup OTP provided by the Donor:");
      if (!otp) return; // Cancelled
    } else if (nextStatus === 'DELIVERED') {
      otp = window.prompt("Please enter the 4-digit Dropoff OTP provided by the Shelter:");
      if (!otp) return; // Cancelled
    }

    setUpdating(id);
    try {
      await updateDeliveryStatus(id, nextStatus, otp);
      await fetchDeliveries(); // Refresh data
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status. Please check your OTP and try again.');
    } finally {
      setUpdating(null);
    }
  };

  const activeDeliveries = deliveries.filter(d => d.status !== 'DELIVERED' && d.status !== 'CANCELLED');
  const completedDeliveries = deliveries.filter(d => d.status === 'DELIVERED');
  
  // Guard against missing user
  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-charcoal font-display">Driver Dashboard</h1>
        <p className="text-brand-charcoal opacity-70">Manage your pickups and deliveries, {user.name || 'Driver'}</p>
        {!driverLocation && (
          <p className="text-orange-500 text-sm mt-2 flex items-center gap-1">
            <MapPin size={14} /> Waiting for GPS signal... Please allow location access.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon={<Truck />} title="Active Deliveries" value={activeDeliveries.length} color="text-brand-orange" />
        <StatCard icon={<CheckCircle2 />} title="Completed Today" value={completedDeliveries.length} color="text-brand-green" />
        <StatCard icon={<Navigation />} title="Total Km Driven" value={deliveries.reduce((acc, curr) => acc + (curr.distance_km || 0), 0).toFixed(1)} color="text-brand-sky" />
      </div>

      <h2 className="text-xl font-bold mb-4 font-display">Current Assignments</h2>
      
      {loading && (
        <div className="flex justify-center items-center h-32">
          <div className="text-slate-500 animate-pulse">Loading your route...</div>
        </div>
      )}
      
      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}
      
      {!loading && !error && activeDeliveries.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-[0_1px_3px_0_rgba(15,23,42,0.05)] border border-slate-200 mb-8">
          <Truck className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500 font-medium">No active deliveries assigned to you right now.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 mb-12">
        {activeDeliveries.map(delivery => (
          <DeliveryCard 
            key={delivery.id} 
            delivery={delivery} 
            driverLocation={driverLocation}
            onUpdate={(next) => handleUpdateStatus(delivery.id, delivery.status, next)}
            isUpdating={updating === delivery.id}
          />
        ))}
      </div>

      {completedDeliveries.length > 0 && (
        <>
          <h2 className="text-xl font-bold mb-4 text-slate-500 font-display">Completed Deliveries</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-80">
            {completedDeliveries.map(delivery => (
              <div key={delivery.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow transition-shadow">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-600">Ticket #{delivery.id.slice(-6).toUpperCase()}</span>
                  <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-bold">DELIVERED</span>
                </div>
                <p className="text-sm text-slate-500 line-clamp-1"><MapPin size={14} className="inline mr-1 text-slate-400"/> {delivery.dropoff_address || 'Destination unknown'}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DeliveryCard({ delivery, driverLocation, onUpdate, isUpdating }) {
  const flowInfo = STATUS_FLOW[delivery.status];
  const [routeInfo, setRouteInfo] = useState(null);

  const handleNavigate = () => {
    const isPickup = ['ASSIGNED', 'ACCEPTED', 'PICKUP_STARTED'].includes(delivery.status);
    const destLat = isPickup ? delivery.pickup_latitude : delivery.dropoff_latitude;
    const destLon = isPickup ? delivery.pickup_longitude : delivery.dropoff_longitude;
    
    if (destLat == null || destLon == null) {
      alert("Coordinates missing for destination.");
      return;
    }
    
    let url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLon}`;
    if (driverLocation) {
      url += `&origin=${driverLocation[0]},${driverLocation[1]}`;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_0_rgba(15,23,42,0.05)] border border-slate-200 overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md">
      <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Delivery Ticket</span>
            <h3 className="font-bold text-lg text-brand-charcoal font-display">#{delivery.id.slice(-8).toUpperCase()}</h3>
            {delivery.food_name && (
              <p className="text-sm font-semibold text-brand-green mt-1">
                {delivery.quantity} {delivery.unit} • {delivery.food_name}
              </p>
            )}
          </div>
          <span className={`px-3 py-1 text-xs rounded-full font-bold text-white ${flowInfo?.color || 'bg-slate-500'}`}>
            {delivery.status.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="space-y-4 relative mb-4">
          <div className="flex gap-3 relative z-10">
            <div className="mt-1 bg-orange-50 border border-orange-100 p-1.5 rounded-full text-brand-orange h-fit"><MapPin size={16}/></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pickup</p>
              <p className="font-medium text-slate-700">{delivery.pickup_address || 'Address pending'}</p>
            </div>
          </div>
          
          {/* Connector Line */}
          <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-slate-200 z-0"></div>

          <div className="flex gap-3 relative z-10">
            <div className="mt-1 bg-brand-light border border-green-100 p-1.5 rounded-full text-brand-green h-fit"><MapPin size={16}/></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Dropoff</p>
              <p className="font-medium text-slate-700">{delivery.dropoff_address || 'Address pending'}</p>
            </div>
          </div>
        </div>

        {/* Dynamic Map Component */}
        {delivery.status !== 'DELIVERED' && (
          <DeliveryMap 
            pickupLocation={delivery.pickup_latitude && delivery.pickup_longitude ? [delivery.pickup_latitude, delivery.pickup_longitude] : null}
            destinationLocation={delivery.dropoff_latitude && delivery.dropoff_longitude ? [delivery.dropoff_latitude, delivery.dropoff_longitude] : null}
            driverLocation={driverLocation}
            pickupAddress={delivery.pickup_address}
            dropoffAddress={delivery.dropoff_address}
            deliveryStatus={delivery.status}
            onRouteCalculated={setRouteInfo}
          />
        )}

        {/* Delivery Proof Input */}
        {delivery.status === 'OUT_FOR_DELIVERY' && (
          <div className="mt-6 p-5 border border-dashed border-slate-300 rounded-xl bg-slate-50">
            <p className="text-sm font-bold text-slate-700 mb-3">Delivery Proof Required</p>
            <textarea 
              placeholder="Optional delivery note (e.g. Left at front desk)" 
              className="w-full text-sm p-3 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-all"
              rows="2"
            ></textarea>
          </div>
        )}
      </div>
      
      <div className="p-6 bg-slate-50 md:w-64 flex flex-col justify-center items-center text-center">
        <div className="mb-6">
          <p className="text-4xl font-black text-brand-charcoal tracking-tighter">
            {routeInfo ? routeInfo.distanceKm : (delivery.distance_km ?? '?')}
            <span className="text-base font-semibold text-slate-400 ml-1">km</span>
          </p>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
            {routeInfo ? `Est. ${routeInfo.durationMin} min` : 'Est. Distance'}
          </p>
          {delivery.incentive_amount > 0 && (
            <div className="mt-4 py-2 px-3 bg-brand-emerald/10 border border-brand-emerald/20 rounded-lg">
              <p className="text-[10px] text-brand-emerald font-bold uppercase tracking-wider">Driver Incentive</p>
              <p className="text-xl font-bold text-brand-emerald">₹{delivery.incentive_amount}</p>
            </div>
          )}
        </div>
        
        {delivery.status === 'ASSIGNED' ? (
          <div className="flex flex-col gap-3 w-full mt-2">
            <button 
              onClick={() => onUpdate('ACCEPTED')}
              disabled={isUpdating}
              className="w-full bg-brand-green text-white font-bold py-3.5 px-4 rounded-lg hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center min-h-[48px] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isUpdating ? 'PROCESSING...' : 'ACCEPT DELIVERY'}
            </button>
            <button 
              onClick={() => onUpdate('CANCELLED')}
              disabled={isUpdating}
              className="w-full bg-white border border-slate-200 text-red-600 font-bold py-3 px-4 rounded-lg hover:bg-red-50 active:scale-[0.98] transition-all flex items-center justify-center gap-1 min-h-[48px] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <X size={18} /> DECLINE
            </button>
          </div>
        ) : flowInfo?.next && (
          <button 
            onClick={() => onUpdate(flowInfo.next)}
            disabled={isUpdating}
            className={`w-full mt-2 text-white font-bold py-3.5 px-4 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[48px] shadow-sm disabled:opacity-70 disabled:cursor-not-allowed ${flowInfo.color}`}
          >
            {isUpdating ? 'UPDATING...' : <>{flowInfo.label} <ChevronRight size={20} /></>}
          </button>
        )}
        
        {/* Navigation Button */}
        {['ACCEPTED', 'PICKUP_STARTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(delivery.status) && (
          <button 
            onClick={handleNavigate}
            className="w-full mt-3 bg-brand-charcoal text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[48px] shadow-sm"
          >
            <Navigation size={18} /> OPEN MAPS
          </button>
        )}
        
        {/* Cancel Button */}
        {['ACCEPTED', 'PICKUP_STARTED'].includes(delivery.status) && (
          <button 
            onClick={() => {
              if (window.confirm('Are you sure you cannot complete this delivery? This will release the task for other drivers.')) {
                onUpdate('CANCELLED');
              }
            }}
            disabled={isUpdating}
            className="w-full mt-3 bg-white border border-red-200 text-red-500 font-bold py-2 px-4 rounded-lg hover:bg-red-50 active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-1 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <X size={16} /> CAN'T DELIVER
          </button>
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
