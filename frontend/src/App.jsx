import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import DonorDashboard from './pages/DonorDashboard';
import DonationForm from './components/DonationForm';
import MatchingUI from './pages/MatchingUI';
import DriverDashboard from './pages/DriverDashboard';
import ImpactDashboard from './pages/ImpactDashboard';

function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-5xl font-bold text-brand-green mb-6 text-center tracking-tight">SURPLUS TO SHELTER</h1>
      <p className="text-2xl text-brand-charcoal mb-10 text-center italic">"Rescue surplus. Feed communities. Reduce waste."</p>
      
      <div className="flex gap-4">
        <Link to="/donor" className="bg-brand-green text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-brand-charcoal transition-all shadow-lg transform hover:-translate-y-1">
          I am a Donor
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
            <div className="flex gap-4 font-semibold text-gray-600">
              <Link to="/donor" className="hover:text-brand-green transition">Donor Dashboard</Link>
              <Link to="/driver" className="hover:text-orange-500 transition">Driver Dashboard</Link>
              <Link to="/impact" className="hover:text-brand-emerald transition">Impact</Link>
            </div>
          </div>
        </nav>
        
        {/* Main Content */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/donor" element={<DonorDashboard />} />
          <Route path="/donor/new" element={<DonationForm />} />
          <Route path="/donor/matches/:id" element={<MatchingUI />} />
          <Route path="/driver" element={<DriverDashboard />} />
          <Route path="/impact" element={<ImpactDashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
