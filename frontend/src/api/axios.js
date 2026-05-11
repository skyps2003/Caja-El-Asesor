import axios from 'axios';

const API = axios.create({    
  baseURL: import.meta.env.VITE_API_URL || 'https://caja-el-asesor.onrender.com/api',
});

// Interceptor para agregar token JWT en cada request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticacion
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
