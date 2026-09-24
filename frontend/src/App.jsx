import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import DonorDashboard from './pages/DonorDashboard';
import DonationForm from './components/DonationForm';
import MatchingUI from './pages/MatchingUI';
import DriverDashboard from './pages/DriverDashboard';
import ImpactDashboard from './pages/ImpactDashboard';
import ShelterDashboard from './pages/ShelterDashboard';
import DonorHistory from './pages/DonorHistory';
import ShelterHistory from './pages/ShelterHistory';

function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-5xl font-bold text-brand-green mb-6 text-center tracking-tight">SURPLUS TO SHELTER</h1>
      <p className="text-2xl text-brand-charcoal mb-10 text-center italic">"Rescue surplus. Feed communities. Reduce waste."</p>
      
      <div className="flex flex-wrap gap-4 justify-center">
        <Link to="/donor" className="bg-brand-green text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-brand-charcoal transition-all shadow-lg transform hover:-translate-y-1">
          I am a Donor
        </Link>
        <Link to="/shelter" className="bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-600 transition-all shadow-lg transform hover:-translate-y-1">
          I am a Shelter
        </Link>
        <Link to="/driver" className="bg-orange-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all shadow-lg transform hover:-translate-y-1">
          I am a Driver
        </Link>
      </div>
      
      <Link to="/impact" className="mt-12 text-brand-emerald font-bold hover:underline flex items-center gap-2">
        See Our Global Impact →
      </Link>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-brand-light">
        {/* Simple Navbar */}
        <nav className="bg-white shadow-sm border-b border-gray-100 p-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link to="/" className="text-2xl font-black text-brand-green tracking-tighter">S2S</Link>
            <div className="flex gap-4 font-semibold text-gray-600 items-center">
              <Link to="/donor" className="hover:text-brand-green transition">Donor</Link>
              <Link to="/shelter" className="hover:text-blue-500 transition">Shelter</Link>
              <Link to="/driver" className="hover:text-orange-500 transition">Driver</Link>
              <Link to="/impact" className="hover:text-brand-emerald transition">Impact</Link>
              <button className="relative p-2 text-gray-400 hover:text-brand-green transition bg-gray-50 rounded-full ml-2">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
              </button>
            </div>
          </div>
        </nav>
        
        {/* Main Content */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/donor" element={<DonorDashboard />} />
          <Route path="/donor/new" element={<DonationForm />} />
          <Route path="/donor/history" element={<DonorHistory />} />
          <Route path="/donor/matches/:id" element={<MatchingUI />} />
          <Route path="/shelter" element={<ShelterDashboard />} />
          <Route path="/shelter/history" element={<ShelterHistory />} />
          <Route path="/driver" element={<DriverDashboard />} />
          <Route path="/impact" element={<ImpactDashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
