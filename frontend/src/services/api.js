import axios from 'axios';

// Vite env vars start with VITE_
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

export const getDeliveries = async () => {
  const response = await api.get('/deliveries');
  return response.data;
};

export const createDelivery = async (data) => {
  const response = await api.post('/deliveries', data);
  return response.data;
};

export const updateDeliveryStatus = async (id, status) => {
  const response = await api.put(`/deliveries/${id}/status`, { status });
  return response.data;
};

export const getImpact = async () => {
  const response = await api.get('/impact');
  return response.data;
};

// Add other api calls as we build out more phases...

export default api;
