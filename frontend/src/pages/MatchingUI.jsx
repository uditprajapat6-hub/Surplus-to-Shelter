import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMatches, getDonation, createDelivery } from '../services/api';
import { MapPin, Users, Heart, CheckCircle2 } from 'lucide-react';

export default function MatchingUI() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [donationData, matchData] = await Promise.all([
          getDonation(id),
          getMatches(id)
        ]);
        setDonation(donationData);
        setMatches(matchData.matches);
      } catch (err) {
        setError('Failed to load matching data.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleAcceptMatch = async (match) => {
    setAccepting(match.shelter.id);
    try {
      await createDelivery({
        donation_id: id,
        shelter_id: match.shelter.id,
        driver_id: "auto_assigned_driver_1", // In a real app this might be assigned differently
        pickup_address: donation.pickup_address,
        dropoff_address: match.shelter.organization_name, // Simplified dropoff
        distance_km: match.distance_km
      });
      navigate('/donor');
    } catch (err) {
      alert("Failed to assign delivery.");
      setAccepting(null);
    }
  };

  if (loading) return <div className="text-center p-12 text-gray-500">Finding the best recipients...</div>;
  if (error) return <div className="text-center p-12 text-red-500">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-brand-charcoal mb-2">Matching Engine</h1>
      <p className="text-gray-600 mb-8">Finding the perfect recipient for: <span className="font-bold text-brand-green">{donation?.food_name}</span> ({donation?.quantity} {donation?.unit})</p>

      {matches.length === 0 ? (
        <div className="bg-white p-8 rounded-xl text-center border">
          <Heart className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">No suitable shelters found right now. We'll keep looking!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {matches.map((match, index) => {
            const shelter = match.shelter;
            const isBestMatch = index === 0;
            
            return (
              <div key={shelter.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${isBestMatch ? 'ring-2 ring-brand-emerald border-transparent' : 'border-gray-200'}`}>
                {isBestMatch && <div className="bg-brand-emerald text-white text-xs font-bold px-4 py-1 uppercase tracking-wider">Top Recommendation</div>}
                
                <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{shelter.organization_name}</h2>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1"><MapPin size={16} className="text-brand-orange"/> {match.distance_km} km away</span>
                      <span className="flex items-center gap-1"><Users size={16} className="text-blue-500"/> Serves {shelter.people_served}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-500 mb-1">Capacity</p>
                        <p className="font-bold">{shelter.current_capacity} / {shelter.max_capacity} kg</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-500 mb-1">Looking for</p>
                        <p className="font-bold truncate">{shelter.food_needs.join(', ')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center md:w-48 bg-brand-light p-4 rounded-xl">
                    <div className="text-4xl font-black text-brand-green mb-1">{match.compatibility_score}%</div>
                    <p className="text-xs text-gray-500 font-bold uppercase mb-4">Match Score</p>
                    
                    <button 
                      onClick={() => handleAcceptMatch(match)}
                      disabled={accepting === shelter.id}
                      className="w-full bg-brand-green text-white font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition flex items-center justify-center gap-2"
                    >
                      {accepting === shelter.id ? 'Accepting...' : <><CheckCircle2 size={18} /> Accept Match</>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
