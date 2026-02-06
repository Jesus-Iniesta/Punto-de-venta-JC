import { useState, useEffect } from 'react';
import '../styles/components/SellerForm.css';

const SellerForm = ({ seller, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact_info: '',
    is_active: true,
  });
  const [errors, setErrors] = useState({});

  // Si estamos editando, cargar datos del vendedor
  useEffect(() => {
    if (seller) {
      setFormData({
        name: seller.name || '',
        contact_info: seller.contact_info || '',
        is_active: seller.is_active !== undefined ? seller.is_active : true,
      });
    }
  }, [seller]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del vendedor es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="seller-form-container">
      <form onSubmit={handleSubmit} className="seller-form">
        <h2 className="seller-form-title">
          {seller ? 'Editar Vendedor' : 'Crear Nuevo Vendedor'}
        </h2>
        
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Nombre del Vendedor <span className="required">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`form-input ${errors.name ? 'input-error' : ''}`}
            placeholder="Ej: María González"
            disabled={isLoading}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="contact_info" className="form-label">
            Información de Contacto
          </label>
          <textarea
            id="contact_info"
            name="contact_info"
            value={formData.contact_info}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Teléfono, email, dirección..."
            rows="3"
            disabled={isLoading}
          />
        </div>

        {seller && (
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                disabled={isLoading}
              />
              <span>Vendedor activo</span>
            </label>
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn-cancel"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : seller ? 'Actualizar' : 'Crear Vendedor'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SellerForm;
