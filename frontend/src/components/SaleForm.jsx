import { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import sellersService from '../services/sellersService';
import '../styles/components/SaleForm.css';

const SaleForm = ({ onSubmit, onCancel, isLoading }) => {
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    product_id: '',
    seller_id: '',
    quantity: 1,
    discount: 0,
    amount_paid: 0,
    payment_method: 'CASH',
    notes: '',
    due_date: ''
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [calculations, setCalculations] = useState({
    subtotal: 0,
    discountAmount: 0,
    total: 0,
    remaining: 0
  });
  const [errors, setErrors] = useState({});

  // Cargar productos y vendedores
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [productsData, sellersData] = await Promise.all([
          productService.getAllProducts(0, 100),
          sellersService.getAllSellers(0, 100)
        ]);
        
        // Filtrar solo productos activos con stock
        const availableProducts = productsData.filter(p => p.is_active && p.stock > 0);
        setProducts(availableProducts);
        
        // Filtrar solo vendedores activos
        const activeSellers = sellersData.filter(s => s.is_active);
        setSellers(activeSellers);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  // Calcular precios en tiempo real
  useEffect(() => {
    if (!selectedProduct) {
      setCalculations({ subtotal: 0, discountAmount: 0, total: 0, remaining: 0 });
      return;
    }

    const subtotal = selectedProduct.price * formData.quantity;
    const discountAmount = subtotal * (formData.discount / 100);
    const total = subtotal - discountAmount;
    const remaining = total - formData.amount_paid;

    setCalculations({
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      total: total.toFixed(2),
      remaining: remaining.toFixed(2)
    });
  }, [selectedProduct, formData.quantity, formData.discount, formData.amount_paid]);

  const handleProductChange = (e) => {
    const productId = parseInt(e.target.value);
    const product = products.find(p => p.id === productId);
    
    setSelectedProduct(product);
    setFormData({ ...formData, product_id: productId });
    
    // Limpiar error
    if (errors.product_id) {
      setErrors({ ...errors, product_id: '' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validaciones específicas
    if (name === 'quantity' && selectedProduct) {
      const qty = parseInt(value) || 0;
      if (qty > selectedProduct.stock) {
        setErrors({ ...errors, quantity: `Stock disponible: ${selectedProduct.stock}` });
        return;
      } else {
        setErrors({ ...errors, quantity: '' });
      }
    }

    if (name === 'discount') {
      const discount = parseFloat(value) || 0;
      if (discount < 0 || discount > 100) {
        setErrors({ ...errors, discount: 'El descuento debe estar entre 0 y 100' });
        return;
      } else {
        setErrors({ ...errors, discount: '' });
      }
    }

    if (name === 'amount_paid') {
      const paid = parseFloat(value) || 0;
      if (paid > parseFloat(calculations.total)) {
        setErrors({ ...errors, amount_paid: 'El pago no puede ser mayor al total' });
        return;
      } else {
        setErrors({ ...errors, amount_paid: '' });
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.product_id) {
      newErrors.product_id = 'Selecciona un producto';
    }

    if (!formData.seller_id) {
      newErrors.seller_id = 'Selecciona un vendedor';
    }

    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = 'La cantidad debe ser al menos 1';
    }

    if (selectedProduct && formData.quantity > selectedProduct.stock) {
      newErrors.quantity = `Stock insuficiente. Disponible: ${selectedProduct.stock}`;
    }

    if (!formData.payment_method) {
      newErrors.payment_method = 'Selecciona un método de pago';
    }

    // Validar fecha de vencimiento si hay saldo pendiente
    if (parseFloat(calculations.remaining) > 0 && !formData.due_date) {
      newErrors.due_date = 'Ingresa una fecha de vencimiento para el saldo pendiente';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // Preparar datos para enviar
      const saleData = {
        product_id: formData.product_id,
        seller_id: formData.seller_id,
        quantity: parseInt(formData.quantity),
        discount: parseFloat(formData.discount) || 0,
        subtotal: parseFloat(calculations.subtotal),
        amount_paid: parseFloat(formData.amount_paid) || 0,
        payment_method: formData.payment_method,
        notes: formData.notes || null,
        due_date: formData.due_date || null
      };

      onSubmit(saleData);
    }
  };

  if (loadingData) {
    return (
      <div className="sale-form-loading">
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="sale-form-container">
      <form onSubmit={handleSubmit} className="sale-form">
        <h2 className="sale-form-title">Registrar Nueva Venta</h2>

        <div className="form-row">
          {/* Producto */}
          <div className="form-group">
            <label htmlFor="product_id" className="form-label">
              Producto <span className="required">*</span>
            </label>
            <select
              id="product_id"
              name="product_id"
              value={formData.product_id}
              onChange={handleProductChange}
              className={`form-select ${errors.product_id ? 'input-error' : ''}`}
              disabled={isLoading}
            >
              <option value="">Selecciona un producto</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} - ${product.price} (Stock: {product.stock})
                </option>
              ))}
            </select>
            {errors.product_id && <span className="error-message">{errors.product_id}</span>}
          </div>

          {/* Vendedor */}
          <div className="form-group">
            <label htmlFor="seller_id" className="form-label">
              Vendedor <span className="required">*</span>
            </label>
            <select
              id="seller_id"
              name="seller_id"
              value={formData.seller_id}
              onChange={handleChange}
              className={`form-select ${errors.seller_id ? 'input-error' : ''}`}
              disabled={isLoading}
            >
              <option value="">Selecciona un vendedor</option>
              {sellers.map(seller => (
                <option key={seller.id} value={seller.id}>
                  {seller.name}
                </option>
              ))}
            </select>
            {errors.seller_id && <span className="error-message">{errors.seller_id}</span>}
          </div>
        </div>

        <div className="form-row">
          {/* Cantidad */}
          <div className="form-group">
            <label htmlFor="quantity" className="form-label">
              Cantidad <span className="required">*</span>
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className={`form-input ${errors.quantity ? 'input-error' : ''}`}
              min="1"
              disabled={isLoading || !selectedProduct}
            />
            {errors.quantity && <span className="error-message">{errors.quantity}</span>}
          </div>

          {/* Descuento */}
          <div className="form-group">
            <label htmlFor="discount" className="form-label">
              Descuento (%)
            </label>
            <input
              type="number"
              id="discount"
              name="discount"
              value={formData.discount}
              onChange={handleChange}
              className={`form-input ${errors.discount ? 'input-error' : ''}`}
              min="0"
              max="100"
              step="0.01"
              disabled={isLoading || !selectedProduct}
            />
            {errors.discount && <span className="error-message">{errors.discount}</span>}
          </div>
        </div>

        {/* Cálculos en tiempo real */}
        {selectedProduct && (
          <div className="calculations-panel">
            <div className="calc-row">
              <span className="calc-label">Subtotal:</span>
              <span className="calc-value">${calculations.subtotal}</span>
            </div>
            {formData.discount > 0 && (
              <div className="calc-row">
                <span className="calc-label">Descuento ({formData.discount}%):</span>
                <span className="calc-value discount">-${calculations.discountAmount}</span>
              </div>
            )}
            <div className="calc-row total">
              <span className="calc-label">Total:</span>
              <span className="calc-value">${calculations.total}</span>
            </div>
          </div>
        )}

        <div className="form-row">
          {/* Monto pagado */}
          <div className="form-group">
            <label htmlFor="amount_paid" className="form-label">
              Monto Pagado
            </label>
            <input
              type="number"
              id="amount_paid"
              name="amount_paid"
              value={formData.amount_paid}
              onChange={handleChange}
              className={`form-input ${errors.amount_paid ? 'input-error' : ''}`}
              min="0"
              step="0.01"
              disabled={isLoading || !selectedProduct}
            />
            {errors.amount_paid && <span className="error-message">{errors.amount_paid}</span>}
          </div>

          {/* Método de pago */}
          <div className="form-group">
            <label htmlFor="payment_method" className="form-label">
              Método de Pago <span className="required">*</span>
            </label>
            <select
              id="payment_method"
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              className={`form-select ${errors.payment_method ? 'input-error' : ''}`}
              disabled={isLoading}
            >
              <option value="CASH">Efectivo</option>
              <option value="CARD">Tarjeta</option>
              <option value="TRANSFER">Transferencia</option>
              <option value="MIXED">Mixto</option>
            </select>
            {errors.payment_method && <span className="error-message">{errors.payment_method}</span>}
          </div>
        </div>

        {/* Monto restante */}
        {selectedProduct && parseFloat(calculations.remaining) > 0 && (
          <div className="remaining-alert">
            <span className="remaining-label">⚠️ Monto Restante:</span>
            <span className="remaining-value">${calculations.remaining}</span>
          </div>
        )}

        {/* Fecha de vencimiento (solo si hay saldo) */}
        {selectedProduct && parseFloat(calculations.remaining) > 0 && (
          <div className="form-group">
            <label htmlFor="due_date" className="form-label">
              Fecha de Vencimiento <span className="required">*</span>
            </label>
            <input
              type="date"
              id="due_date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className={`form-input ${errors.due_date ? 'input-error' : ''}`}
              min={new Date().toISOString().split('T')[0]}
              disabled={isLoading}
            />
            {errors.due_date && <span className="error-message">{errors.due_date}</span>}
          </div>
        )}

        {/* Notas */}
        <div className="form-group">
          <label htmlFor="notes" className="form-label">
            Notas Adicionales
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="form-textarea"
            rows="3"
            placeholder="Cliente, dirección de entrega, detalles especiales..."
            disabled={isLoading}
          />
        </div>

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
            disabled={isLoading || !selectedProduct}
          >
            {isLoading ? 'Registrando...' : 'Registrar Venta'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SaleForm;
