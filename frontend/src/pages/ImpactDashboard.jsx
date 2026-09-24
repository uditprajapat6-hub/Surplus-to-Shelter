import React, { useState, useEffect } from 'react';
import { Globe, Leaf, Utensils, Truck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getImpact } from '../services/api';

export default function ImpactDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchImpact() {
      try {
        const data = await getImpact();
        setMetrics(data);
      } catch (err) {
        setError('Failed to load impact metrics.');
      } finally {
        setLoading(false);
      }
    }
    fetchImpact();
  }, []);

  if (loading) return <div className="text-center p-12 text-gray-500">Loading our global impact...</div>;
  if (error) return <div className="text-center p-12 text-red-500">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-brand-charcoal mb-4">Our Collective Impact</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">Every meal rescued is a step towards zero hunger and a greener planet. Here is what we've achieved together.</p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <ImpactCard 
          icon={<Utensils size={32} />} 
          title="Equivalent Meals" 
          value={metrics.equivalent_meals.toLocaleString()} 
          subtitle="Served to those in need"
          color="bg-brand-orange text-white" 
        />
        <ImpactCard 
          icon={<Leaf size={32} />} 
          title="CO₂ Avoided" 
          value={`${metrics.co2_emissions_saved_kg.toLocaleString()} kg`} 
          subtitle="Greenhouse gas prevented"
          color="bg-brand-emerald text-white" 
        />
        <ImpactCard 
          icon={<Globe size={32} />} 
          title="Food Rescued" 
          value={`${metrics.total_food_rescued_kg.toLocaleString()} kg`} 
          subtitle="Diverted from landfills"
          color="bg-brand-green text-white" 
        />
        <ImpactCard 
          icon={<Truck size={32} />} 
          title="Deliveries" 
          value={metrics.total_deliveries_completed.toLocaleString()} 
          subtitle="Successful transports"
          color="bg-blue-500 text-white" 
        />
      </div>

      {/* Chart Section */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-brand-charcoal">Food Rescued Over Time (kg)</h2>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics.monthly_trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRescued" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#81B29A" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#81B29A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="rescued" 
                stroke="#3D405B" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRescued)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ImpactCard({ icon, title, value, subtitle, color }) {
  return (
    <div className={`${color} p-8 rounded-2xl shadow-lg transform transition duration-300 hover:scale-105`}>
      <div className="mb-4 opacity-80">{icon}</div>
      <h3 className="text-4xl font-black mb-1">{value}</h3>
      <p className="text-lg font-bold mb-1">{title}</p>
      <p className="text-sm opacity-80">{subtitle}</p>
    </div>
  );
}
