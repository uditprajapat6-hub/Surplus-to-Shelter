import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const auth = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await login(email, password);
      // login via Context instead of just API
      if (auth && auth.login) {
        auth.login(data.access_token, data.role, data.user_id);
      } else {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('user_id', data.user_id);
      }
      
      const role = data.role.toLowerCase();
      navigate(`/${role}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 min-h-[calc(100vh-73px)]">
      <div className="w-full max-w-md">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-light mb-6 shadow-sm border border-slate-100">
            <span className="text-3xl font-black text-brand-green tracking-tighter">S2S</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-charcoal font-display">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-sans">
            Enter your credentials to access your dispatch dashboard.
          </p>
        </div>

        {/* Role Selector / Quick Login */}
        <div className="flex gap-2 mb-6 justify-center">
          <button 
            onClick={() => { setEmail('uditprajapat@gmail.com'); setPassword('password123'); }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors border border-slate-200"
          >
            Donor
          </button>
          <button 
            onClick={() => { setEmail('saketsharma7125@gmail.com'); setPassword('password123'); }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors border border-slate-200"
          >
            Shelter
          </button>
          <button 
            onClick={() => { setEmail('2004sksonu@gmail.com'); setPassword('password123'); }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors border border-slate-200"
          >
            Driver
          </button>
        </div>

        {/* Login Card (Level 1 Elevation) */}
        <div className="bg-white py-8 px-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.05),0_1px_2px_-1px_rgba(15,23,42,0.03)] rounded-2xl border border-slate-200 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5 font-sans">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 h-[48px] md:h-[44px] border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green focus:ring-offset-1 transition-colors sm:text-sm"
                  placeholder="name@organization.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5 font-sans">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 h-[48px] md:h-[44px] border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green focus:ring-offset-1 transition-colors sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-brand-green hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green active:scale-[0.98] transition-all min-h-[48px] items-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Sign in securely'}
              </button>
            </div>
          </form>
          
          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-slate-500 font-sans">
                New to Surplus to Shelter?
              </span>
            </div>
          </div>
          
          <div className="mt-6">
            <Link
              to="/register"
              className="w-full flex justify-center py-3 px-4 border border-slate-200 rounded-lg shadow-sm text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green min-h-[48px] items-center"
            >
              Create an account
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
