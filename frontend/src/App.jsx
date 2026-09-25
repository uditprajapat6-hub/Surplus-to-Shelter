import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Bell, LogOut, User as UserIcon } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';

import DonorDashboard from './pages/DonorDashboard';
import DonationForm from './components/DonationForm';
import MatchingUI from './pages/MatchingUI';
import DriverDashboard from './pages/DriverDashboard';
import ImpactDashboard from './pages/ImpactDashboard';
import ShelterDashboard from './pages/ShelterDashboard';
import DonorHistory from './pages/DonorHistory';
import ShelterHistory from './pages/ShelterHistory';
import DonationDetails from './pages/DonationDetails';
import Login from './pages/Login';
import Register from './pages/Register';

function Home() {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col min-h-[calc(100vh-73px)]">
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-white to-brand-light">
        <h1 className="text-5xl md:text-6xl font-black text-brand-charcoal mb-6 tracking-tight max-w-4xl">
          <span className="text-brand-green">SURPLUS</span> TO <span className="text-brand-sky">SHELTER</span>
        </h1>
        <p className="text-2xl text-slate-500 mb-10 max-w-2xl font-light">
          "Rescue surplus. Feed communities. Reduce waste."
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center mb-16">
          {user ? (
            <Link to={`/${user.role.toLowerCase()}`} className="bg-brand-green text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg transform hover:-translate-y-1 w-64 flex flex-col items-center">
              <span>GO TO DASHBOARD</span>
              <span className="text-sm font-normal opacity-90 mt-1">Continue as {user.role.toLowerCase()}</span>
            </Link>
          ) : (
            <>
              <Link to="/login" className="bg-brand-green text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg transform hover:-translate-y-1 w-64 flex flex-col items-center">
                <span>LOGIN</span>
                <span className="text-sm font-normal opacity-90 mt-1">I am a Donor</span>
              </Link>
              <Link to="/login" className="bg-brand-sky text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-sky-700 transition-all shadow-lg transform hover:-translate-y-1 w-64 flex flex-col items-center">
                <span>LOGIN</span>
                <span className="text-sm font-normal opacity-90 mt-1">I am a Shelter</span>
              </Link>
              <Link to="/login" className="bg-brand-orange text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition-all shadow-lg transform hover:-translate-y-1 w-64 flex flex-col items-center">
                <span>LOGIN</span>
                <span className="text-sm font-normal opacity-90 mt-1">I am a Driver</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their respective dashboard
    const rolePath = user.role.toLowerCase();
    return <Navigate to={`/${rolePath}`} replace />;
  }
  
  return children;
};

const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 p-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to={user ? `/${user.role.toLowerCase()}` : "/"} className="text-2xl font-black text-brand-green tracking-tighter">S2S</Link>
        
        <div className="flex gap-4 font-semibold text-slate-600 items-center">
          {user ? (
            <>
              {!isHome && (
                <>
                  {user.role === 'DONOR' && <Link to="/donor" className="hover:text-brand-green transition">Donor Dashboard</Link>}
                  {user.role === 'SHELTER' && <Link to="/shelter" className="hover:text-brand-sky transition">Shelter Dashboard</Link>}
                  {user.role === 'DRIVER' && <Link to="/driver" className="hover:text-brand-orange transition">Driver Dashboard</Link>}
                </>
              )}
              
              <Link to="/impact" className="hover:text-emerald-500 transition">Impact</Link>
              
              <div className="h-6 w-px bg-slate-200 mx-2"></div>
              
              <button className="relative p-2 text-slate-400 hover:text-brand-green transition bg-slate-50 rounded-full">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
              </button>
              
              <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition">
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/impact" className="hover:text-emerald-500 transition">Impact</Link>
              <Link to="/login" className="text-brand-green hover:text-emerald-700 transition px-4 py-2">Login</Link>
              <Link to="/register" className="bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-brand-light flex flex-col font-sans">
          <Navigation />
          
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/impact" element={<ImpactDashboard />} />
              
              {/* Protected Donor Routes */}
              <Route path="/donor" element={<ProtectedRoute allowedRoles={['DONOR']}><DonorDashboard /></ProtectedRoute>} />
              <Route path="/donor/new" element={<ProtectedRoute allowedRoles={['DONOR']}><DonationForm /></ProtectedRoute>} />
              <Route path="/donor/history" element={<ProtectedRoute allowedRoles={['DONOR']}><DonorHistory /></ProtectedRoute>} />
              <Route path="/donor/matches/:id" element={<ProtectedRoute allowedRoles={['DONOR']}><MatchingUI /></ProtectedRoute>} />
              <Route path="/donor/donations/:id" element={<ProtectedRoute allowedRoles={['DONOR', 'SHELTER']}><DonationDetails /></ProtectedRoute>} />
              
              {/* Protected Shelter Routes */}
              <Route path="/shelter" element={<ProtectedRoute allowedRoles={['SHELTER']}><ShelterDashboard /></ProtectedRoute>} />
              <Route path="/shelter/history" element={<ProtectedRoute allowedRoles={['SHELTER']}><ShelterHistory /></ProtectedRoute>} />
              
              {/* Protected Driver Routes */}
              <Route path="/driver" element={<ProtectedRoute allowedRoles={['DRIVER']}><DriverDashboard /></ProtectedRoute>} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
