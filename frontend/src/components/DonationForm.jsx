import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDonation } from '../services/api';

export default function DonationForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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
    latitude: 0,
    longitude: 0,
    description: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Format data for backend
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity) || 0,
        allergens: formData.allergens.split(',').map(a => a.trim()).filter(a => a),
        preparation_time: new Date(formData.preparation_time).toISOString(),
        expiry_time: new Date(formData.expiry_time).toISOString(),
      };

      await createDonation(payload);
      setSuccess(true);
      setTimeout(() => navigate('/donor'), 2000); // Redirect after success
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit donation. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-md text-center border-t-4 border-brand-green">
        <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Donation Posted Successfully!</h2>
        <p className="text-gray-600 mb-6">Your surplus food is now looking for a match.</p>
        <p className="text-sm text-gray-400">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-10 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-brand-charcoal">Post Surplus Food</h2>
      
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Food Name *</label>
            <input required type="text" name="food_name" value={formData.food_name} onChange={handleChange} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-brand-emerald outline-none" placeholder="e.g. 50 boxes of rice" />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <select required name="food_category" value={formData.food_category} onChange={handleChange} className="w-full border rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-brand-emerald outline-none">
              <option>Cooked meals</option>
              <option>Fruits</option>
              <option>Vegetables</option>
              <option>Bakery</option>
              <option>Packaged food</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Quantity *</label>
            <div className="flex gap-2">
              <input required type="number" step="0.1" name="quantity" value={formData.quantity} onChange={handleChange} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-brand-emerald outline-none" placeholder="e.g. 20" />
              <select name="unit" value={formData.unit} onChange={handleChange} className="border rounded-lg p-2.5 bg-gray-50 outline-none w-24">
                <option>kg</option>
                <option>meals</option>
                <option>items</option>
                <option>liters</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Vegetarian?</label>
            <div className="flex items-center h-[42px]">
              <input type="checkbox" name="is_vegetarian" checked={formData.is_vegetarian} onChange={handleChange} className="w-5 h-5 text-brand-green rounded" />
              <span className="ml-2 text-sm text-gray-700">Yes, this is vegetarian</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Preparation Time *</label>
            <input required type="datetime-local" name="preparation_time" value={formData.preparation_time} onChange={handleChange} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-brand-emerald outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Safe-to-donate until *</label>
            <input required type="datetime-local" name="expiry_time" value={formData.expiry_time} onChange={handleChange} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-brand-emerald outline-none" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Pickup Address *</label>
            <input required type="text" name="pickup_address" value={formData.pickup_address} onChange={handleChange} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-brand-emerald outline-none" placeholder="Full street address" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Allergens (comma separated)</label>
            <input type="text" name="allergens" value={formData.allergens} onChange={handleChange} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-brand-emerald outline-none" placeholder="e.g. Nuts, Dairy, Gluten" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Additional Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-brand-emerald outline-none" placeholder="Any special pickup instructions or food details?"></textarea>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-brand-green text-white font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Posting...' : 'Post Donation'}
        </button>
      </form>
    </div>
  );
}
