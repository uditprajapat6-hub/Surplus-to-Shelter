import axios from 'axios';

// Vite env vars start with VITE_
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getDonations = async () => {
  const response = await api.get('/donations');
  return response.data;
};

export const createDonation = async (data) => {
  const response = await api.post('/donations', data);
  return response.data;
};

export const getDonation = async (id) => {
  const response = await api.get(`/donations/${id}`);
  return response.data;
};

export const getMatches = async (donationId) => {
  const response = await api.post(`/matching/${donationId}`);
  return response.data;
};

export const autoMatchDonation = async (donationId) => {
  const response = await api.post(`/matching/${donationId}/auto-match`);
  return response.data;
};

export const getDeliveries = async () => {
  const response = await api.get('/deliveries');
  return response.data;
};

export const createDelivery = async (data) => {
  const response = await api.post('/deliveries', data);
  return response.data;
};

export const updateDeliveryStatus = async (id, status, otp = null) => {
  const response = await api.put(`/deliveries/${id}/status`, { status, otp });
  return response.data;
};

export const getImpact = async () => {
  const response = await api.get('/impact');
  return response.data;
};

export const login = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);
  const response = await axios.post(`${API_URL}/auth/login`, formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  if (response.data.access_token) {
    localStorage.setItem('token', response.data.access_token);
    localStorage.setItem('role', response.data.role); // Standardized key to match AuthContext
    localStorage.setItem('user_id', response.data.user_id);
  }
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Add other api calls as we build out more phases...
export const getShelter = async (id) => {
  const response = await api.get(`/shelters/${id}`);
  return response.data;
};

export default api;
