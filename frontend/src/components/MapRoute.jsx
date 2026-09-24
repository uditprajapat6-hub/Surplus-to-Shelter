import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// For hackathon simplicity, we mock coordinates if real ones aren't provided
// In a real app we would use Google Maps / Mapbox Geocoding API based on the address
const MOCK_PICKUP_COORD = [34.0522, -118.2437]; // Los Angeles
const MOCK_DROPOFF_COORD = [34.0622, -118.2537];

export default function MapRoute({ delivery }) {
  // Center map roughly between pickup and dropoff
  const center = [
    (MOCK_PICKUP_COORD[0] + MOCK_DROPOFF_COORD[0]) / 2,
    (MOCK_PICKUP_COORD[1] + MOCK_DROPOFF_COORD[1]) / 2
  ];

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden shadow-inner border border-gray-200 mt-4 relative z-0">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker position={MOCK_PICKUP_COORD}>
          <Popup>
            <div className="font-bold text-orange-600">Pickup</div>
            <div className="text-xs">{delivery.pickup_address}</div>
          </Popup>
        </Marker>

        <Marker position={MOCK_DROPOFF_COORD}>
          <Popup>
            <div className="font-bold text-brand-green">Dropoff</div>
            <div className="text-xs">{delivery.dropoff_address}</div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
