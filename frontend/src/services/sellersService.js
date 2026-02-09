import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const sellersService = {
  // Obtener todos los vendedores
  getAllSellers: async (skip = 0, limit = 100) => {
    const response = await api.get(`/sellers/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Obtener vendedor por ID
  getSellerById: async (sellerId) => {
    const response = await api.get(`/sellers/${sellerId}`);
    return response.data;
  },

  // Crear vendedor (solo admin)
  createSeller: async (sellerData) => {
    const response = await api.post('/sellers/', sellerData);
    return response.data;
  },

  // Actualizar vendedor (solo admin)
  updateSeller: async (sellerId, sellerData) => {
    const response = await api.put(`/sellers/${sellerId}`, sellerData);
    return response.data;
  },

  // Desactivar vendedor (solo admin)
  // En el backend, este endpoint pone is_active = False
  deleteSeller: async (sellerId) => {
    const response = await api.delete(`/sellers/${sellerId}`);
    return response.data;
  },

  // Obtener ventas de un vendedor
  getSalesBySeller: async (sellerId, skip = 0, limit = 100) => {
    const response = await api.get(`/sellers/${sellerId}/sales?skip=${skip}&limit=${limit}`);
    return response.data;
  },
};

export default sellersService;
