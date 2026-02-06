import { useState } from 'react';
import '../styles/components/InvestmentModal.css';

const InvestmentModal = ({ onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Ingresa un monto válido mayor a 0';
    }

    if (!formData.description || formData.description.trim() === '') {
      newErrors.description = 'Ingresa una descripción de la inversión';
    }

    if (!formData.date) {
      newErrors.date = 'Selecciona una fecha';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      const investmentData = {
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        date: new Date(formData.date).toISOString()
      };

      onSubmit(investmentData);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="investment-modal-overlay" onClick={onCancel}>
      <div className="investment-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="investment-modal-header">
          <h2>💰 Registrar Inversión Inicial</h2>
          <button 
            className="investment-modal-close" 
            onClick={onCancel}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="investment-form">
          <div className="investment-form-group">
            <label htmlFor="amount">
              Monto <span className="required">*</span>
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              disabled={isLoading}
              className={errors.amount ? 'error' : ''}
            />
            {errors.amount && <span className="error-message">{errors.amount}</span>}
          </div>

          <div className="investment-form-group">
            <label htmlFor="description">
              Descripción <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Ej: Compra inicial de flores, materiales, etc."
              rows="3"
              disabled={isLoading}
              className={errors.description ? 'error' : ''}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="investment-form-group">
            <label htmlFor="date">
              Fecha <span className="required">*</span>
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              disabled={isLoading}
              className={errors.date ? 'error' : ''}
            />
            {errors.date && <span className="error-message">{errors.date}</span>}
          </div>

          <div className="investment-form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={isLoading}
            >
              {isLoading ? 'Registrando...' : 'Registrar Inversión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvestmentModal;
