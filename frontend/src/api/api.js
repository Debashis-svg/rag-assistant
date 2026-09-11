import axios from 'axios';

const apiRoot = (
  import.meta.env.VITE_API_URL ||
  'http://localhost:4000'
).replace(/\/$/, '');

const api = axios.create({
  baseURL: `${apiRoot}/api`
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;