import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapBounds({ pickup, dropoff, driver }) {
  const map = useMap();
  useEffect(() => {
    const points = [];
    if (pickup) points.push(pickup);
    if (dropoff) points.push(dropoff);
    if (driver) points.push(driver);
    
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, pickup, dropoff, driver]);
  return null;
}

export default function DeliveryMap({ pickupLocation, destinationLocation, driverLocation, pickupAddress, dropoffAddress, deliveryStatus, onRouteCalculated }) {
  const [route, setRoute] = useState(null);

  // Fetch the fastest route using OSRM Open Source Routing Machine
  useEffect(() => {
    let start, end;
    
    // Dynamically choose route based on current task
    if (['ACCEPTED', 'PICKUP_STARTED'].includes(deliveryStatus)) {
      start = driverLocation;
      end = pickupLocation;
    } else if (['PICKED_UP', 'OUT_FOR_DELIVERY'].includes(deliveryStatus)) {
      start = driverLocation || pickupLocation;
      end = destinationLocation;
    } else {
      start = pickupLocation;
      end = destinationLocation;
    }

    if (start && end) {
      fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`)
        .then(res => res.json())
        .then(data => {
          if (data.routes && data.routes[0]) {
            // Convert GeoJSON [lon, lat] to Leaflet [lat, lon]
            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            setRoute(coords);
            
            if (onRouteCalculated) {
              onRouteCalculated({
                distanceKm: (data.routes[0].distance / 1000).toFixed(1),
                durationMin: Math.round(data.routes[0].duration / 60)
              });
            }
          }
        })
        .catch(err => console.error("Routing error:", err));
    }
  }, [driverLocation, pickupLocation, destinationLocation, deliveryStatus]);

  // Default to a central location (e.g. New Delhi or generic) if everything is missing
  const fallbackCoord = [28.6139, 77.2090]; 
  
  const pickup = pickupLocation || fallbackCoord;

  const showDriver = ['ACCEPTED', 'PICKUP_STARTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(deliveryStatus);

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden shadow-[0_1px_3px_0_rgba(15,23,42,0.05)] border border-slate-200 mt-4 relative z-0">
      <MapContainer center={pickup} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {route && (
          <Polyline 
            positions={route} 
            color="#0ea5e9" 
            weight={5} 
            opacity={0.8} 
            dashArray="10, 10" 
            className="animate-pulse"
          />
        )}
        
        {pickupLocation && (
          <Marker position={pickupLocation}>
            <Popup>
              <div className="font-bold text-orange-600">Pickup</div>
              <div className="text-xs">{pickupAddress || 'Donor Location'}</div>
            </Popup>
          </Marker>
        )}

        {destinationLocation && (
          <Marker position={destinationLocation}>
            <Popup>
              <div className="font-bold text-brand-green">Dropoff</div>
              <div className="text-xs">{dropoffAddress || 'Shelter Location'}</div>
            </Popup>
          </Marker>
        )}
        
        {showDriver && driverLocation && (
          <Marker position={driverLocation}>
            <Popup>
              <div className="font-bold text-brand-sky">Driver (Live)</div>
            </Popup>
          </Marker>
        )}

        <MapBounds pickup={pickupLocation} dropoff={destinationLocation} driver={showDriver ? driverLocation : null} />
      </MapContainer>
    </div>
  );
}
