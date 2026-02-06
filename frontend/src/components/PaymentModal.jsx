import { useState } from 'react';
import '../styles/components/PaymentModal.css';

const PaymentModal = ({ sale, onSubmit, onClose, isLoading }) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);

    const numValue = parseFloat(value) || 0;
    if (numValue > sale.amount_remaining) {
      setError(`El pago no puede exceder el monto restante ($${sale.amount_remaining})`);
    } else if (numValue <= 0) {
      setError('El pago debe ser mayor a 0');
    } else {
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const numAmount = parseFloat(amount);
    if (numAmount > 0 && numAmount <= sale.amount_remaining && !error) {
      onSubmit(numAmount);
    }
  };

  const handleQuickAmount = (percentage) => {
    const quickAmount = (sale.amount_remaining * percentage / 100).toFixed(2);
    setAmount(quickAmount);
    setError('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Registrar Pago</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="sale-info">
            <div className="info-row">
              <span className="info-label">Producto:</span>
              <span className="info-value">{sale.product?.name || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Total de la Venta:</span>
              <span className="info-value">${sale.total_price}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Ya Pagado:</span>
              <span className="info-value">${sale.amount_paid}</span>
            </div>
            <div className="info-row highlight">
              <span className="info-label">Monto Restante:</span>
              <span className="info-value">${sale.amount_remaining}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="payment-form">
            <div className="form-group">
              <label htmlFor="amount" className="form-label">
                Monto a Pagar <span className="required">*</span>
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={handleAmountChange}
                className={`form-input ${error ? 'input-error' : ''}`}
                placeholder="0.00"
                step="0.01"
                min="0"
                max={sale.amount_remaining}
                disabled={isLoading}
                autoFocus
              />
              {error && <span className="error-message">{error}</span>}
            </div>

            {/* Botones de monto rápido */}
            <div className="quick-amounts">
              <span className="quick-label">Montos rápidos:</span>
              <div className="quick-buttons">
                <button
                  type="button"
                  className="btn-quick"
                  onClick={() => handleQuickAmount(25)}
                  disabled={isLoading}
                >
                  25%
                </button>
                <button
                  type="button"
                  className="btn-quick"
                  onClick={() => handleQuickAmount(50)}
                  disabled={isLoading}
                >
                  50%
                </button>
                <button
                  type="button"
                  className="btn-quick"
                  onClick={() => handleQuickAmount(75)}
                  disabled={isLoading}
                >
                  75%
                </button>
                <button
                  type="button"
                  className="btn-quick"
                  onClick={() => setAmount(sale.amount_remaining.toString())}
                  disabled={isLoading}
                >
                  100%
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={onClose}
                className="btn-cancel"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={isLoading || !!error || !amount}
              >
                {isLoading ? 'Registrando...' : 'Registrar Pago'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
