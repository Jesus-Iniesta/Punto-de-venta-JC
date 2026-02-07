import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productService, BASE_URL } from '../services/productService';
import RelatedProductsCarousel from '../components/RelatedProductsCarousel';
import '../styles/pages/ProductPage.css';

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    image_url: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await productService.getProductById(id);
      setProduct(data);
      
      // Construir URL completa de la imagen
      const fullImageUrl = data.image_url 
        ? `${BASE_URL}${data.image_url}`
        : '';
      
      setFormData({
        name: data.name,
        description: data.description || '',
        price: data.price,
        stock: data.stock,
        image_url: data.image_url || ''
      });
      setImagePreview(fullImageUrl);
    } catch (err) {
      setError('Error al cargar el producto');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setFormErrors({});
    if (!isEditing) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock: product.stock,
        image_url: product.image_url || ''
      });
      setImagePreview(product.image_url || '');
      setImageFile(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFormErrors(prev => ({ ...prev, image: 'La imagen no debe superar 10MB' }));
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFormErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'El nombre es requerido';
    if (formData.price < 0) errors.price = 'El precio no puede ser negativo';
    if (formData.stock < 0) errors.stock = 'El stock no puede ser negativo';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Actualizar datos del producto
      const updatedProduct = await productService.updateProduct(id, {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      });

      // Subir nueva imagen si se seleccionó
      if (imageFile) {
        await productService.uploadProductImage(id, imageFile);
      }

      setProduct(updatedProduct);
      setIsEditing(false);
      setImageFile(null);
      await loadProduct();
    } catch (err) {
      if (err.response?.status === 403) {
        setError('No tienes permisos para editar este producto');
      } else {
        setError('Error al actualizar el producto');
      }
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      return;
    }

    try {
      setLoading(true);
      await productService.deleteProduct(id);
      navigate('/');
    } catch (err) {
      if (err.response?.status === 403) {
        setError('No tienes permisos para eliminar este producto');
      } else {
        setError('Error al eliminar el producto');
      }
      console.error('Error:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="product-page">
        <div className="product-loading">Cargando producto...</div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="product-page">
        <div className="product-error">{error}</div>
        <button onClick={() => navigate('/')} className="back-button">
          Volver al inicio
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-page">
        <div className="product-error">Producto no encontrado</div>
        <button onClick={() => navigate('/')} className="back-button">
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="product-page">
      <div className="product-container">
        <button onClick={() => navigate('/')} className="back-button">
          ← Volver
        </button>

        {error && <div className="error-message">{error}</div>}

        <div className="product-main">
          {/* Imagen */}
          <div className="product-image-section">
            <div className="product-image-container">
              <img
                src={imagePreview || 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800'}
                alt={product.name}
                className="product-image"
              />
            </div>
            {isEditing && (
              <div className="image-edit">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input"
                  id="imageUpload"
                />
                <label htmlFor="imageUpload" className="file-label">
                  Cambiar imagen
                </label>
                {formErrors.image && <span className="error-text">{formErrors.image}</span>}
              </div>
            )}
          </div>

          {/* Información */}
          <div className="product-info-section">
            {isEditing ? (
              <>
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={formErrors.name ? 'error' : ''}
                  />
                  {formErrors.name && <span className="error-text">{formErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label>Precio</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    className={formErrors.price ? 'error' : ''}
                  />
                  {formErrors.price && <span className="error-text">{formErrors.price}</span>}
                </div>

                <div className="form-group">
                  <label>Stock disponible</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    className={formErrors.stock ? 'error' : ''}
                  />
                  {formErrors.stock && <span className="error-text">{formErrors.stock}</span>}
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="5"
                  />
                </div>

                <div className="action-buttons">
                  <button onClick={handleSave} className="btn-save" disabled={loading}>
                    Guardar cambios
                  </button>
                  <button onClick={handleEditToggle} className="btn-cancel" disabled={loading}>
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="product-title">{product.name}</h1>
                <p className="product-price">${product.price.toFixed(2)}</p>
                <div className="product-stock">
                  Stock disponible: <span>{product.stock}</span> unidades
                </div>
                <div className="product-description">
                  <h3>Descripción</h3>
                  <p>{product.description || 'Sin descripción disponible'}</p>
                </div>

                {isAdmin() && (
                  <div className="admin-actions">
                    <button onClick={handleEditToggle} className="btn-edit">
                      Editar producto
                    </button>
                    <button onClick={handleDelete} className="btn-delete" disabled={loading}>
                      Eliminar producto
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Productos relacionados */}
        <RelatedProductsCarousel currentProductId={id} />
      </div>
    </div>
  );
};

export default ProductPage;
