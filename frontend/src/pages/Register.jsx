import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, login } from '../services/api';
import { MapPin, Search } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DONOR',
    address: '',
    latitude: null,
    longitude: null,
    max_capacity: 100
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [geocodingStatus, setGeocodingStatus] = useState('');
  
  // Auto-suggest address logic
  useEffect(() => {
    if (!formData.address || formData.address.trim().length < 4) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setGeocodingStatus('loading');
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}`);
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
  }, [formData.address]);

  const handleSelectSuggestion = (suggestion) => {
    setFormData(prev => ({ 
      ...prev, 
      address: suggestion.display_name,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon)
    }));
    setShowSuggestions(false);
    setGeocodingStatus('success');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.latitude || !formData.longitude) {
      setError('Please select a valid address from the suggestions dropdown.');
      return;
    }
    
    try {
      await register(formData);
      // Auto login after register
      const data = await login(formData.email, formData.password);
      if (data.role === 'DONOR') navigate('/donor');
      else if (data.role === 'SHELTER') navigate('/shelter');
      else if (data.role === 'DRIVER') navigate('/driver');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] flex py-10 items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-brand-charcoal">Create an Account</h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">I am a...</label>
            <select 
              className="w-full border p-2 rounded focus:ring-2 focus:ring-brand-green outline-none"
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value})}
            >
              <option value="DONOR">Donor (Restaurant/Individual)</option>
              <option value="SHELTER">Shelter / NGO</option>
              <option value="DRIVER">Delivery Driver</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Name / Organization Name</label>
            <input required type="text" className="w-full border p-2 rounded"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input required type="email" className="w-full border p-2 rounded"
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input required type="password" className="w-full border p-2 rounded"
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          {formData.role === 'SHELTER' && (
            <div>
              <label className="block text-sm font-medium mb-1">Max Daily Capacity (in kg/meals)</label>
              <input required type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-brand-green outline-none"
                value={formData.max_capacity} onChange={e => setFormData({...formData, max_capacity: parseInt(e.target.value) || 0})} />
            </div>
          )}
          {formData.role === 'DRIVER' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Vehicle Type</label>
                <select className="w-full border p-2 rounded focus:ring-2 focus:ring-brand-green outline-none"
                  value={formData.vehicle_type || ''} onChange={e => setFormData({...formData, vehicle_type: e.target.value})}>
                  <option value="">Select a vehicle type</option>
                  <option value="Bike">Bike</option>
                  <option value="Car">Car</option>
                  <option value="Truck">Truck</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vehicle Number</label>
                <input required type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-brand-green outline-none" placeholder="e.g. RJ 14 XX 1234"
                  value={formData.vehicle_number || ''} onChange={e => setFormData({...formData, vehicle_number: e.target.value})} />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Address / Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
              <input 
                required 
                type="text" 
                className={`w-full border p-2 pl-9 rounded focus:ring-2 outline-none ${geocodingStatus === 'error' ? 'border-red-400 focus:ring-red-400 bg-red-50' : 'focus:ring-brand-green'}`} 
                placeholder="e.g. Amity University Jaipur"
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})}
                onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
              />
              {geocodingStatus === 'loading' && <Search className="absolute right-3 top-3 text-brand-sky animate-spin" size={16} />}
              
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
          </div>
          <button type="submit" className="w-full bg-brand-green text-white font-bold py-2 rounded hover:bg-opacity-90">
            Register
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
