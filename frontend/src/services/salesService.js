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

export const salesService = {
  // Crear una nueva venta
  createSale: async (saleData) => {
    const response = await api.post('/sales/', saleData);
    return response.data;
  },

  // Obtener todas las ventas con filtros opcionales
  getAllSales: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.skip !== undefined) queryParams.append('skip', params.skip);
    if (params.limit !== undefined) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.seller_id) queryParams.append('seller_id', params.seller_id);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    
    const response = await api.get(`/sales/?${queryParams.toString()}`);
    return response.data;
  },

  // Obtener detalles completos de una venta
  getSaleById: async (saleId) => {
    const response = await api.get(`/sales/${saleId}`);
    return response.data;
  },

  // Actualizar una venta (solo admin, solo PENDING o PARTIAL)
  updateSale: async (saleId, saleData) => {
    const response = await api.put(`/sales/${saleId}`, saleData);
    return response.data;
  },

  // Cambiar el estado de una venta
  updateSaleStatus: async (saleId, status, reason = null) => {
    const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    const response = await api.patch(`/sales/${saleId}/status${params}`, { status });
    return response.data;
  },

  // Registrar un pago adicional en una venta
  registerPayment: async (saleId, amount) => {
    const response = await api.patch(`/sales/${saleId}/payment`, { amount });
    return response.data;
  },

  // Cancelar una venta (restaura stock)
  cancelSale: async (saleId, reason = null) => {
    const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    const response = await api.delete(`/sales/${saleId}${params}`);
    return response.data;
  },

  // Obtener ventas con alertas de vencimiento
  getSalesWithDueAlerts: async (daysThreshold = 2) => {
    const sales = await salesService.getAllSales({ limit: 100 });
    const today = new Date();
    
    return sales
      .filter(sale => {
        // Solo ventas PENDING o PARTIAL con fecha de vencimiento
        if (!sale.due_date || !['PENDING', 'PARTIAL'].includes(sale.status)) {
          return false;
        }
        
        const dueDate = new Date(sale.due_date);
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays <= daysThreshold && diffDays >= 0;
      })
      .map(sale => {
        const dueDate = new Date(sale.due_date);
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          ...sale,
          daysUntilDue: diffDays,
          urgency: diffDays === 0 ? 'critical' : diffDays === 1 ? 'high' : 'medium'
        };
      })
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  },

  // Calcular totales de ventas (para dashboard)
  calculateSalesTotals: (sales) => {
    return sales.reduce((acc, sale) => {
      return {
        totalSales: acc.totalSales + sale.total_price,
        totalPaid: acc.totalPaid + sale.amount_paid,
        totalRemaining: acc.totalRemaining + sale.amount_remaining,
        count: acc.count + 1
      };
    }, {
      totalSales: 0,
      totalPaid: 0,
      totalRemaining: 0,
      count: 0
    });
  }
};

export default salesService;
