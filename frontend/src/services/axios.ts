import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const recruiterToken = localStorage.getItem('nh_recruiter_token');
  if (recruiterToken) {
    config.headers['X-Auth-Token'] = recruiterToken;
  }
  return config;
});

export default api;
