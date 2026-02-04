import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import Navbar from '../components/Navbar';
import '../styles/pages/CreateProduct.css';

const CreateProduct = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost_price: '',
    stock: 0,
    is_active: true,
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Protección: si no es admin, redirigir
  if (!isAdmin()) {
    navigate('/');
    return null;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleImageClick = () => {
    document.getElementById('image-input').click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Formato de imagen no válido. Usa: JPG, PNG o WEBP');
        return;
      }

      // Validar tamaño (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('La imagen es muy grande. Tamaño máximo: 10MB');
        return;
      }

      setImageFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones
    if (!formData.name.trim()) {
      setError('El nombre del producto es requerido');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('El precio debe ser mayor a 0');
      return;
    }

    if (!formData.cost_price || parseFloat(formData.cost_price) <= 0) {
      setError('El precio de costo debe ser mayor a 0');
      return;
    }

    if (parseFloat(formData.price) <= parseFloat(formData.cost_price)) {
      setError('El precio de venta debe ser mayor al precio de costo');
      return;
    }

    setLoading(true);

    try {
      // 1. Crear el producto
      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        cost_price: parseFloat(formData.cost_price),
        stock: parseInt(formData.stock) || 0,
        is_active: formData.is_active,
        image_url: null,
      };

      const createdProduct = await productService.createProduct(productData);

      // 2. Subir imagen si existe
      if (imageFile) {
        await productService.uploadProductImage(createdProduct.id, imageFile);
      }

      setSuccess('Producto creado exitosamente');
      
      // Redirigir después de 1.5 segundos
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-product-page">
      <Navbar />
      
      <div className="create-product-container">
        <div className="create-product-header">
          <h1 className="create-product-title">Crear Producto</h1>
          <p className="create-product-subtitle">Agrega un nuevo artículo al inventario</p>
        </div>

        <form onSubmit={handleSubmit} className="create-product-form">
          {error && <div className="form-message form-error">{error}</div>}
          {success && <div className="form-message form-success">{success}</div>}

          {/* Imagen */}
          <div className="form-section">
            <label className="form-section-title">Imagen del producto</label>
            <div className="image-upload-container" onClick={handleImageClick}>
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="image-preview" />
              ) : (
                <div className="image-placeholder">
                  <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p>Haz clic para subir imagen</p>
                  <span className="upload-hint">JPG, PNG o WEBP (máx. 10MB)</span>
                </div>
              )}
              <input
                type="file"
                id="image-input"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Información básica */}
          <div className="form-section">
            <label className="form-section-title">Información básica</label>
            
            <div className="form-group">
              <label htmlFor="name">Nombre del producto *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ej: Ramo Rosa Clásico"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Descripción</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Describe el producto (opcional)"
              />
            </div>
          </div>

          {/* Precios e inventario */}
          <div className="form-section">
            <label className="form-section-title">Precios e inventario</label>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cost_price">Precio de costo *</label>
                <input
                  type="number"
                  id="cost_price"
                  name="cost_price"
                  value={formData.cost_price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="price">Precio de venta *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="stock">Cantidad en inventario</label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                step="1"
                placeholder="0"
              />
            </div>
          </div>

          {/* Estado */}
          <div className="form-section">
            <div className="form-group-checkbox">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              <label htmlFor="is_active">Producto activo (visible para la venta)</label>
            </div>
          </div>

          {/* Botones */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/')}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;
