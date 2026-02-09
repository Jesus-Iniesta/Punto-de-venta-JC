const API_URL = import.meta.env.VITE_API_URL || '';

export const api = {
  // Auth
  login: async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },
  
  // Users
  getUsers: async (token) => {
    const response = await fetch(`${API_URL}/api/v1/users/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },
  
  createUser: async (userData, token) => {
    const response = await fetch(`${API_URL}/api/v1/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },
  
  // Products
  getProducts: async (token) => {
    const response = await fetch(`${API_URL}/api/v1/products/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },
  
  createProduct: async (productData, token) => {
    const response = await fetch(`${API_URL}/api/v1/products/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });
    return response.json();
  },
  
  updateProduct: async (id, productData, token) => {
    const response = await fetch(`${API_URL}/api/v1/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });
    return response.json();
  },
  
  deleteProduct: async (id, token) => {
    const response = await fetch(`${API_URL}/api/v1/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },
};
