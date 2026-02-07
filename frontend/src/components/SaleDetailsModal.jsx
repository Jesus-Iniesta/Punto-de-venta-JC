import '../styles/components/SaleDetailsModal.css';

const SaleDetailsModal = ({ sale, onClose }) => {
  if (!sale) return null;

  const getStatusText = (status) => {
    const statusMap = {
      PENDING: 'Pendiente',
      PARTIAL: 'Parcial',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada'
    };
    return statusMap[status] || status;
  };

  const getPaymentMethodText = (method) => {
    const methodMap = {
      CASH: 'Efectivo',
      CARD: 'Tarjeta',
      TRANSFER: 'Transferencia',
      MIXED: 'Mixto'
    };
    return methodMap[method] || method;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntilDue = () => {
    if (!sale.due_date) return null;
    const today = new Date();
    const dueDate = new Date(sale.due_date);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue();
  
  return (
    <div className="details-modal-overlay" onClick={onClose}>
      <div className="details-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="details-modal-header">
          <h2>🧾 Detalles de Venta #{sale.id}</h2>
          <button className="details-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="details-modal-body">
          {/* Información del Producto */}
          <div className="details-section">
            <h3 className="section-title">📦 Producto</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Nombre:</span>
                <span className="detail-value">{sale.product_name || 'Sin nombre'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Cantidad:</span>
                <span className="detail-value">{sale.quantity || 0} unidad(es)</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Precio Unitario:</span>
                <span className="detail-value">${sale.unit_price ? sale.unit_price.toFixed(2) : '0.00'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Subtotal:</span>
                <span className="detail-value">${sale.subtotal ? sale.subtotal.toFixed(2) : '0.00'}</span>
              </div>
            </div>
          </div>

          {/* Información Financiera */}
          <div className="details-section">
            <h3 className="section-title">💰 Financiero</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Descuento:</span>
                <span className="detail-value">{sale.discount || 0}%</span>
              </div>
              <div className="detail-item highlight">
                <span className="detail-label">Total:</span>
                <span className="detail-value total">${sale.total_price ? sale.total_price.toFixed(2) : '0.00'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Pagado:</span>
                <span className="detail-value success">${sale.amount_paid ? sale.amount_paid.toFixed(2) : '0.00'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Pendiente:</span>
                <span className="detail-value warning">${sale.amount_remaining ? sale.amount_remaining.toFixed(2) : '0.00'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Método de Pago:</span>
                <span className="detail-value">{getPaymentMethodText(sale.payment_method)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Estado:</span>
                <span className={`status-badge ${sale.status.toLowerCase()}`}>
                  {getStatusText(sale.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Información del Vendedor */}
          <div className="details-section">
            <h3 className="section-title">👤 Vendedor</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Nombre:</span>
                <span className="detail-value">{sale.seller_name || 'Sin nombre'}</span>
              </div>
              {sale.seller_email && (
                <div className="detail-item">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{sale.seller_email}</span>
                </div>
              )}
              {sale.seller_phone && (
                <div className="detail-item">
                  <span className="detail-label">Teléfono:</span>
                  <span className="detail-value">{sale.seller_phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Fechas y Vencimiento */}
          <div className="details-section">
            <h3 className="section-title">📅 Fechas</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Creada:</span>
                <span className="detail-value">{formatDate(sale.created_at)}</span>
              </div>
              {sale.updated_at && (
                <div className="detail-item">
                  <span className="detail-label">Actualizada:</span>
                  <span className="detail-value">{formatDate(sale.updated_at)}</span>
                </div>
              )}
              {sale.due_date && (
                <>
                  <div className="detail-item">
                    <span className="detail-label">Vencimiento:</span>
                    <span className="detail-value">{formatDate(sale.due_date)}</span>
                  </div>
                  {daysUntilDue !== null && sale.status !== 'COMPLETED' && sale.status !== 'CANCELLED' && (
                    <div className="detail-item">
                      <span className="detail-label">Días restantes:</span>
                      <span className={`detail-value ${daysUntilDue < 0 ? 'overdue' : daysUntilDue <= 3 ? 'warning' : ''}`}>
                        {daysUntilDue < 0 
                          ? `Vencido hace ${Math.abs(daysUntilDue)} días` 
                          : daysUntilDue === 0 
                            ? 'Vence hoy' 
                            : `${daysUntilDue} día(s)`}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Ganancias (si está disponible) */}
          {sale.earnings && (
            <div className="details-section">
              <h3 className="section-title">📊 Ganancias</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Precio Costo:</span>
                  <span className="detail-value">${sale.earnings.cost_price ? sale.earnings.cost_price.toFixed(2) : '0.00'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Ganancia:</span>
                  <span className="detail-value success">${sale.earnings.profit ? sale.earnings.profit.toFixed(2) : '0.00'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Margen:</span>
                  <span className="detail-value">{sale.earnings.profit_margin ? sale.earnings.profit_margin.toFixed(1) : '0.0'}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Notas */}
          {sale.notes && (
            <div className="details-section">
              <h3 className="section-title">📝 Notas</h3>
              <p className="notes-text">{sale.notes}</p>
            </div>
          )}
        </div>

        <div className="details-modal-footer">
          <button className="btn-close" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaleDetailsModal;
