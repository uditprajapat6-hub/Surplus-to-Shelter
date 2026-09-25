import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDonation, autoMatchDonation } from '../services/api';
import { MapPin, Search, Map as MapIcon, Crosshair } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationPickerMarker({ position, setPosition, onPositionChange }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      if (onPositionChange) onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker 
      position={position} 
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const newPos = e.target.getLatLng();
          setPosition(newPos);
          if (onPositionChange) onPositionChange(newPos.lat, newPos.lng);
        },
      }}
    />
  );
}

function CenterMapControl({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function DonationForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [geocodingStatus, setGeocodingStatus] = useState(''); // '', 'loading', 'success', 'error'
  const [showMap, setShowMap] = useState(false);
  const [mapCoords, setMapCoords] = useState(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [formData, setFormData] = useState({
    food_name: '',
    food_category: 'Cooked meals',
    quantity: '',
    unit: 'kg',
    preparation_time: '',
    expiry_time: '',
    is_vegetarian: false,
    allergens: '',
    pickup_address: '',
    latitude: null,
    longitude: null,
    description: '',
    estimated_servings: '',
    pickup_available_from: '',
    pickup_available_until: '',
    packaging_condition: 'GOOD'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Reset geocoding if address changes manually (and we haven't locked in map coords)
    if (name === 'pickup_address') {
      setGeocodingStatus('');
    }
  };

  const reverseGeocode = async (lat, lon) => {
    setIsReverseGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await response.json();
      if (data && data.display_name) {
        setFormData(prev => ({ ...prev, pickup_address: data.display_name }));
        setGeocodingStatus('success');
      }
    } catch (err) {
      console.error("Reverse geocoding failed", err);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      }
      return null;
    } catch (err) {
      console.error("Geocoding failed", err);
      return null;
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
          setShowMap(true);
          reverseGeocode(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          alert("Could not access your location. Please grant location permissions.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  // Auto-suggest on map when address is typed
  useEffect(() => {
    if (isReverseGeocoding) {
      setShowSuggestions(false);
      return;
    }
    if (!formData.pickup_address || formData.pickup_address.trim().length < 4) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setGeocodingStatus('loading');
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.pickup_address)}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
          setAddressSuggestions(data);
          setShowSuggestions(true);
          setGeocodingStatus('success');
        } else {
          setAddressSuggestions([]);
          setShowSuggestions(false);
          setGeocodingStatus('error');
        }
      } catch (err) {
        setAddressSuggestions([]);
        setShowSuggestions(false);
        setGeocodingStatus('error');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [formData.pickup_address, isReverseGeocoding]);

  const handleSelectSuggestion = (suggestion) => {
    setIsReverseGeocoding(true); // Prevent re-triggering the effect
    setFormData(prev => ({ ...prev, pickup_address: suggestion.display_name }));
    setMapCoords({ lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) });
    setShowMap(true);
    setShowSuggestions(false);
    setGeocodingStatus('success');
    
    // Reset the block after a short delay
    setTimeout(() => setIsReverseGeocoding(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setMatchResult(null);

    try {
      setGeocodingStatus('loading');
      
      // 1. Geocode the address OR use the exact pinned map coordinates
      let finalCoords = null;
      if (mapCoords) {
        finalCoords = { lat: mapCoords.lat, lon: mapCoords.lng || mapCoords.lon };
      } else {
        finalCoords = await geocodeAddress(formData.pickup_address);
      }
      
      if (!finalCoords) {
        setGeocodingStatus('error');
        setShowMap(true); // Auto-open map if text matching fails
        throw new Error("Could not find this address. Please pinpoint it on the map.");
      }
      setGeocodingStatus('success');
      
      // 2. Format data for backend
      const payload = {
        ...formData,
        latitude: finalCoords.lat,
        longitude: finalCoords.lon,
        quantity: parseFloat(formData.quantity) || 0,
        estimated_servings: parseInt(formData.estimated_servings) || 0,
        allergens: formData.allergens ? formData.allergens.split(',').map(a => a.trim()).filter(a => a) : [],
        preparation_time: new Date(formData.preparation_time).toISOString(),
        expiry_time: new Date(formData.expiry_time).toISOString(),
        pickup_available_from: formData.pickup_available_from ? new Date(formData.pickup_available_from).toISOString() : null,
        pickup_available_until: formData.pickup_available_until ? new Date(formData.pickup_available_until).toISOString() : null,
      };

      const donation = await createDonation(payload);
      
      // 3. Trigger automatic matching
      try {
        const match = await autoMatchDonation(donation.id);
        setMatchResult(match);
      } catch (matchErr) {
        console.warn("No suitable shelter found immediately.");
      }
      
      setSuccess(true);
      setTimeout(() => navigate('/donor'), 4000);
    } catch (err) {
      setError(err.message || err.response?.data?.detail || 'Failed to submit donation. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-[0_1px_3px_0_rgba(15,23,42,0.05)] text-center border-t-4 border-brand-green">
        <div className="w-16 h-16 bg-green-100 text-brand-green rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">✓</div>
        <h2 className="text-2xl font-bold text-brand-charcoal mb-2 font-display">Donation Posted Successfully!</h2>
        
        {matchResult ? (
          <div className="mt-6 bg-brand-light p-6 rounded-xl text-left inline-block w-full max-w-md mx-auto border border-brand-green shadow-sm">
            <div className="flex justify-between items-start mb-4 border-b border-green-200 pb-3">
              <h3 className="font-bold text-brand-green tracking-wider text-sm">BEST MATCH FOUND</h3>
              <div className="bg-brand-green text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                Score: {matchResult.compatibility_score || 95}%
              </div>
            </div>
            
            <p className="font-bold text-xl text-brand-charcoal mb-1 font-display">{matchResult.shelter?.organization_name || 'Nearby Shelter'}</p>
            <p className="text-sm font-medium text-slate-500 mb-4">{matchResult.distance_km || '?'} km away</p>
            
            <div className="bg-white p-4 rounded-lg text-sm mb-4 border border-green-100 shadow-sm">
              <p className="font-bold text-slate-700 mb-2">Why this shelter?</p>
              <ul className="space-y-1.5 text-slate-600">
                <li className="flex items-center gap-2"><span className="text-brand-green font-bold">✓</span> Need for {formData.food_category}</li>
                <li className="flex items-center gap-2"><span className="text-brand-green font-bold">✓</span> Available capacity</li>
                <li className="flex items-center gap-2"><span className="text-brand-green font-bold">✓</span> Route optimized ({matchResult.distance_km || '?'} km)</li>
              </ul>
            </div>
            
            <div className="text-center mt-2">
              <div className="inline-block bg-brand-sky/20 text-brand-sky text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                Status: MATCHED
              </div>
            </div>
          </div>
        ) : (
          <p className="text-slate-600 mb-6 font-medium">Your surplus food is now looking for a match in the network.</p>
        )}
        
        <p className="text-sm text-slate-400 mt-6 font-medium animate-pulse">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-10 bg-white p-8 rounded-xl shadow-[0_1px_3px_0_rgba(15,23,42,0.05)] border border-slate-200">
      <h2 className="text-2xl font-bold mb-6 text-brand-charcoal font-display">Post Surplus Food</h2>
      
      {error && <div className="bg-red-50 text-red-600 font-medium p-4 rounded-lg mb-6 text-sm border border-red-100">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Food Name *</label>
            <input required type="text" name="food_name" value={formData.food_name} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none transition-all" placeholder="e.g. 50 boxes of rice" />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Category *</label>
            <select required name="food_category" value={formData.food_category} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none transition-all">
              <option>Cooked meals</option>
              <option>Fruits</option>
              <option>Vegetables</option>
              <option>Bakery</option>
              <option>Packaged food</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Quantity *</label>
            <div className="flex gap-2">
              <input required type="number" step="0.1" name="quantity" value={formData.quantity} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none transition-all" placeholder="e.g. 20" />
              <select name="unit" value={formData.unit} onChange={handleChange} className="border border-slate-300 rounded-lg p-2.5 bg-slate-50 outline-none w-24">
                <option>kg</option>
                <option>meals</option>
                <option>items</option>
                <option>liters</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Vegetarian?</label>
            <div className="flex items-center h-[42px]">
              <input type="checkbox" name="is_vegetarian" checked={formData.is_vegetarian} onChange={handleChange} className="w-5 h-5 text-brand-green rounded border-slate-300 focus:ring-brand-green" />
              <span className="ml-2 text-sm font-medium text-slate-600">Yes, this is vegetarian</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Preparation Time *</label>
            <DatePicker
              selected={formData.preparation_time ? new Date(formData.preparation_time) : null}
              onChange={(date) => setFormData(prev => ({ ...prev, preparation_time: date }))}
              showTimeSelect
              timeFormat="hh:mm aa"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-green outline-none transition-all"
              required
              placeholderText="Select date and time"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Safe-to-donate until *</label>
            <DatePicker
              selected={formData.expiry_time ? new Date(formData.expiry_time) : null}
              onChange={(date) => setFormData(prev => ({ ...prev, expiry_time: date }))}
              showTimeSelect
              timeFormat="hh:mm aa"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-green outline-none transition-all"
              required
              placeholderText="Select date and time"
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex justify-between items-end mb-1.5">
              <label className="block text-sm font-bold text-slate-700">Pickup Address *</label>
              <button 
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="text-brand-green text-sm font-bold flex items-center gap-1 hover:text-emerald-700"
              >
                <MapIcon size={16} /> {showMap ? 'Hide Map' : 'Pin on Map'}
              </button>
            </div>
            
            <div className="relative mb-3">
              <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                required 
                type="text" 
                name="pickup_address" 
                value={formData.pickup_address} 
                onChange={handleChange} 
                onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                className={`w-full border rounded-lg p-2.5 pl-10 focus:ring-2 outline-none transition-all ${geocodingStatus === 'error' ? 'border-red-400 focus:ring-red-400 bg-red-50' : 'border-slate-300 focus:ring-brand-green focus:border-brand-green'} ${isReverseGeocoding ? 'bg-slate-50 text-slate-500' : ''}`}
                placeholder="Full street address, City, State" 
                readOnly={isReverseGeocoding}
              />
              {(geocodingStatus === 'loading' || isReverseGeocoding) && <Search className="absolute right-3 top-3 text-brand-sky animate-spin" size={18} />}
              
              {/* Auto-suggest Dropdown */}
              {showSuggestions && addressSuggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-slate-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {addressSuggestions.map((suggestion, idx) => (
                    <li 
                      key={idx}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="p-3 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 truncate"
                    >
                      <MapPin className="inline mr-2 text-slate-400" size={14} />
                      {suggestion.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {geocodingStatus === 'error' && <p className="text-xs text-red-500 mb-3 font-medium">Please provide a more exact address to map this location, or pin it below.</p>}
            
            {/* Interactive Map Block */}
            {showMap && (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm relative z-0 mb-4 bg-slate-50">
                <div className="p-3 bg-white border-b border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">Interactive Location Picker</span>
                  <button 
                    type="button" 
                    onClick={handleGetCurrentLocation}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                  >
                    <Crosshair size={14} /> Use My Location
                  </button>
                </div>
                
                <div className="h-64 w-full relative z-0">
                  <MapContainer 
                    center={mapCoords || [28.6139, 77.2090]} // Fallback to New Delhi
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationPickerMarker position={mapCoords} setPosition={setMapCoords} onPositionChange={reverseGeocode} />
                    {mapCoords && <CenterMapControl center={mapCoords} />}
                  </MapContainer>
                </div>
                <div className="p-3 bg-slate-100 text-xs text-slate-600 flex justify-between items-center">
                  <span>Click anywhere on the map or drag the pin to set precise coordinates.</span>
                  {mapCoords && (
                    <span className="font-bold text-brand-green">
                      Pinned: {mapCoords.lat.toFixed(4)}, {mapCoords.lng.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Allergens (comma separated)</label>
            <input type="text" name="allergens" value={formData.allergens} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-green outline-none transition-all" placeholder="e.g. Nuts, Dairy, Gluten" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Additional Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-green outline-none transition-all resize-none" placeholder="Any special pickup instructions or food details?"></textarea>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-brand-green text-white font-bold py-3.5 px-4 rounded-lg hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          {loading ? (
            <><Search className="animate-spin" size={18} /> Validating Location...</>
          ) : 'Post Donation'}
        </button>
      </form>
    </div>
  );
}
