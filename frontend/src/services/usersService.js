import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para agregar el token
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

export const usersService = {
  // Obtener todos los usuarios con búsqueda opcional
  getAllUsers: async (search = '') => {
    const params = search ? { search } : {};
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Obtener usuario por ID
  getUserById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Actualizar rol de usuario
  updateUserRole: async (userId, role) => {
    const response = await api.put(`/users/${userId}/role`, { role });
    return response.data;
  },

  // Actualizar contraseña de usuario
  updateUserPassword: async (userId, newPassword) => {
    const response = await api.put(`/users/${userId}/password`, { 
      new_password: newPassword 
    });
    return response.data;
  },

  // Eliminar usuario (soft delete)
  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },
};

export default usersService;
