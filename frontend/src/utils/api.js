import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const apiKey = localStorage.getItem('api_key');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (apiKey) {
    config.headers['x-api-key'] = apiKey;
  }

  return config;
});

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  signup: async (name, email, password) => {
    const response = await api.post('/auth/signup', { name, email, password });
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
};

export const plansAPI = {
  getPlans: async () => {
    const response = await api.get('/plans');
    return response.data;
  },

  selectPlan: async (planCode) => {
    const response = await api.post('/plans/select', { plan_code: planCode });
    return response.data;
  },
};

export const dashboardAPI = {
  getDashboard: async () => {
    const response = await api.get('/dashboard/me');
    return response.data;
  },
};

export const patentAPI = {
  getPatentByNumber: async (patentNumber) => {
    const response = await api.get(`/v1/patents/${encodeURIComponent(patentNumber)}`);
    return response.data;
  },
};

export default api;