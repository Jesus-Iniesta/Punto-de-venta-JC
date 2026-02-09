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

export const earningsService = {
  // Obtener resumen general de ganancias
  getSummary: async () => {
    const response = await api.get('/earnings/summary');
    return response.data;
  },

  // Obtener ganancias por producto
  getByProduct: async (orderBy = 'profit') => {
    const response = await api.get('/earnings/by-product', {
      params: { order_by: orderBy }
    });
    return response.data;
  },

  // Obtener ganancias por período
  getByPeriod: async (period = 'month', startDate = null, endDate = null) => {
    const params = { period };
    
    // Convertir fechas a formato ISO con timezone si se proporcionan
    if (startDate) {
      const date = new Date(startDate);
      date.setHours(0, 0, 0, 0);
      params.start_date = date.toISOString();
    }
    if (endDate) {
      const date = new Date(endDate);
      date.setHours(23, 59, 59, 999);
      params.end_date = date.toISOString();
    }
    
    const response = await api.get('/earnings/by-period', { params });
    return response.data;
  },

  // Obtener ganancias por vendedor
  getBySeller: async () => {
    const response = await api.get('/earnings/by-seller');
    return response.data;
  },

  // Obtener ganancia de una venta específica
  getBySale: async (saleId) => {
    const response = await api.get(`/earnings/${saleId}`);
    return response.data;
  },

  // Registrar inversión inicial (solo admin)
  registerInvestment: async (investmentData) => {
    const response = await api.post('/earnings/investment', investmentData);
    return response.data;
  },

  // Listar todas las inversiones
  getInvestments: async (skip = 0, limit = 100) => {
    const response = await api.get(`/earnings/investments?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Actualizar earning (solo admin)
  updateEarning: async (earningId, costPrice = null, salePrice = null) => {
    const params = {};
    if (costPrice !== null) params.cost_price = costPrice;
    if (salePrice !== null) params.sale_price = salePrice;
    
    const response = await api.put(`/earnings/earning/${earningId}`, null, { params });
    return response.data;
  }
};

export default earningsService;
