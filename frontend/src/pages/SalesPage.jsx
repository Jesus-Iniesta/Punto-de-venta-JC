import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import SaleForm from '../components/SaleForm';
import PaymentModal from '../components/PaymentModal';
import InvestmentModal from '../components/InvestmentModal';
import SaleDetailsModal from '../components/SaleDetailsModal';
import salesService from '../services/salesService';
import earningsService from '../services/earningsService';
import '../styles/pages/SalesPage.css';

const SalesPage = () => {
  const { isAdmin } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [dueAlerts, setDueAlerts] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [earningsSummary, setEarningsSummary] = useState(null);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [saleDetails, setSaleDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadSales();
    checkDueAlerts();
    loadEarningsSummary();
    
    // Revisar alertas cada 5 minutos
    const interval = setInterval(checkDueAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await salesService.getAllSales({ limit: 100 });
      setSales(data);
    } catch (err) {
      console.error('Error al cargar ventas:', err);
      setError('No se pudieron cargar las ventas. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const loadEarningsSummary = async () => {
    try {
      const summary = await earningsService.getSummary();
      setEarningsSummary(summary);
    } catch (err) {
      console.error('Error al cargar resumen de ganancias:', err);
      // No mostrar error, es opcional
    }
  };

  const checkDueAlerts = async () => {
    try {
      const alerts = await salesService.getSalesWithDueAlerts(2);
      setDueAlerts(alerts);
    } catch (err) {
      console.error('Error al cargar alertas:', err);
    }
  };

  const handleCreateSale = async (saleData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      await salesService.createSale(saleData);
      setSuccessMessage('Venta registrada exitosamente');
      setShowForm(false);
      await loadSales();
      await checkDueAlerts();
      await loadEarningsSummary();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error al crear venta:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Error al registrar la venta. Por favor, intenta de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterPayment = async (amount) => {
    try {
      setIsSubmitting(true);
      setError(null);

      await salesService.registerPayment(selectedSale.id, amount);
      setSuccessMessage('Pago registrado exitosamente');
      setShowPaymentModal(false);
      setSelectedSale(null);
      await loadSales();
      await checkDueAlerts();
      await loadEarningsSummary();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error al registrar pago:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Error al registrar el pago. Por favor, intenta de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSale = async (saleId, productName) => {
    const reason = prompt(`¿Por qué deseas cancelar la venta de "${productName}"?`);
    if (reason === null) return; // Usuario canceló

    try {
      setError(null);
      await salesService.cancelSale(saleId, reason || 'Sin motivo especificado');
      setSuccessMessage('Venta cancelada exitosamente');
      await loadSales();
      await checkDueAlerts();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error al cancelar venta:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Error al cancelar la venta. Por favor, intenta de nuevo.');
      }
    }
  };

  const openPaymentModal = async (saleId) => {
    try {
      const saleDetails = await salesService.getSaleById(saleId);
      setSelectedSale(saleDetails);
      setShowPaymentModal(true);
    } catch (err) {
      console.error('Error al cargar detalles de venta:', err);
      setError('No se pudieron cargar los detalles de la venta.');
    }
  };

  const handleRegisterInvestment = async (investmentData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      await earningsService.registerInvestment(investmentData);
      setSuccessMessage('Inversión registrada exitosamente');
      setShowInvestmentModal(false);
      await loadEarningsSummary();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error al registrar inversión:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Error al registrar la inversión. Por favor, intenta de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDetailsModal = async (saleId) => {
    try {
      setLoading(true);
      const details = await salesService.getSaleById(saleId);
      setSaleDetails(details);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Error al cargar detalles de venta:', err);
      setError('No se pudieron cargar los detalles de la venta.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      PENDING: 'status-pending',
      PARTIAL: 'status-partial',
      COMPLETED: 'status-completed',
      CANCELLED: 'status-cancelled'
    };
    return classes[status] || '';
  };

  const getStatusText = (status) => {
    const texts = {
      PENDING: 'Pendiente',
      PARTIAL: 'Parcial',
      COMPLETED: 'Completado',
      CANCELLED: 'Cancelado'
    };
    return texts[status] || status;
  };

  const getDueDateClass = (sale) => {
    if (!sale.due_date || sale.status === 'COMPLETED' || sale.status === 'CANCELLED') {
      return '';
    }

    const today = new Date();
    const dueDate = new Date(sale.due_date);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'due-today';
    if (diffDays <= 2) return 'due-soon';
    return '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredSales = filterStatus === 'ALL' 
    ? sales 
    : sales.filter(sale => sale.status === filterStatus);

  // Calcular totales solo con ventas NO canceladas
  const activeSales = sales.filter(sale => sale.status !== 'CANCELLED');
  const totals = salesService.calculateSalesTotals(activeSales);

  return (
    <>
      <Navbar />
      <div className="sales-page">
        <div className="sales-container">
          {/* Alertas de vencimiento */}
          {dueAlerts.length > 0 && (
            <div className="due-alerts-banner">
              <div className="alert-icon">⚠️</div>
              <div className="alert-content">
                <strong>Alertas de Vencimiento:</strong>
                <span>{dueAlerts.length} venta(s) con pago próximo a vencer</span>
              </div>
            </div>
          )}

          <div className="sales-header">
            <div className="header-left">
              <h1 className="sales-title">Gestión de Ventas</h1>
              <div className="sales-stats">
                <div className="stat-card">
                  <span className="stat-label">Total Ventas Activas</span>
                  <span className="stat-value">${totals.totalSales.toFixed(2)}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Total Pagado</span>
                  <span className="stat-value success">${totals.totalPaid.toFixed(2)}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Pendiente de Pago</span>
                  <span className="stat-value warning">${totals.totalRemaining.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Resumen de Ganancias (solo ventas completadas) */}
              {earningsSummary && (
                <div className="earnings-summary">
                  <h3 className="earnings-title">📊 Resumen de Ganancias</h3>
                  <div className="earnings-stats">
                    <div className="earnings-stat">
                      <span className="earnings-label">Invertido</span>
                      <span className="earnings-value">${earningsSummary.total_invested.toFixed(2)}</span>
                    </div>
                    <div className="earnings-stat">
                      <span className="earnings-label">Vendido</span>
                      <span className="earnings-value">${earningsSummary.total_sold.toFixed(2)}</span>
                    </div>
                    <div className="earnings-stat highlight">
                      <span className="earnings-label">Ganancia</span>
                      <span className={`earnings-value ${earningsSummary.gross_profit >= 0 ? 'profit' : 'loss'}`}>
                        {earningsSummary.gross_profit >= 0 ? '+' : ''}${earningsSummary.gross_profit.toFixed(2)}
                      </span>
                    </div>
                    <div className="earnings-stat">
                      <span className="earnings-label">Margen Promedio</span>
                      <span className="earnings-value">{earningsSummary.average_profit_margin.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {!showForm && (
              <div className="header-actions">
                <button className="btn-create" onClick={() => setShowForm(true)}>
                  + Registrar Venta
                </button>
                {isAdmin && (
                  <button 
                    className="btn-investment" 
                    onClick={() => setShowInvestmentModal(true)}
                    title="Registrar inversión inicial"
                  >
                    💰 Inversión
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mensajes */}
          {successMessage && (
            <div className="alert alert-success">{successMessage}</div>
          )}
          {error && (
            <div className="alert alert-error">{error}</div>
          )}

          {/* Formulario de creación */}
          {showForm && (
            <SaleForm
              onSubmit={handleCreateSale}
              onCancel={() => setShowForm(false)}
              isLoading={isSubmitting}
            />
          )}

          {/* Filtros */}
          <div className="sales-filters">
            <div className="filter-group">
              <label>Filtrar por estado:</label>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="ALL">Todos</option>
                <option value="PENDING">Pendientes</option>
                <option value="PARTIAL">Parciales</option>
                <option value="COMPLETED">Completados</option>
                <option value="CANCELLED">Cancelados</option>
              </select>
            </div>
          </div>

          {/* Tabla de ventas */}
          {loading ? (
            <div className="loading-container">
              <p>Cargando ventas...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="empty-state">
              <p>No hay ventas registradas</p>
              <button className="btn-create-alt" onClick={() => setShowForm(true)}>
                Registrar primera venta
              </button>
            </div>
          ) : (
            <div className="sales-table-container">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Producto</th>
                    <th>Vendedor</th>
                    <th>Cant.</th>
                    <th>Total</th>
                    <th>Pagado</th>
                    <th>Restante</th>
                    <th>Estado</th>
                    <th>Vencimiento</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => {
                    const dueDateClass = getDueDateClass(sale);
                    const isAlert = dueAlerts.some(alert => alert.id === sale.id);

                    return (
                      <tr 
                        key={sale.id} 
                        className={`${dueDateClass} ${isAlert ? 'alert-row' : ''} clickable-row`}
                        onClick={() => openDetailsModal(sale.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{sale.id}</td>
                        <td className="product-name">
                          {sale.product_name || sale.product?.name || `Producto #${sale.product_id}`}
                        </td>
                        <td className="seller-name">
                          {sale.seller_name || sale.seller?.name || `Vendedor #${sale.seller_id}`}
                        </td>
                        <td>{sale.quantity}</td>
                        <td className="amount">${sale.total_price}</td>
                        <td className="amount success">${sale.amount_paid}</td>
                        <td className="amount warning">${sale.amount_remaining}</td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(sale.status)}`}>
                            {getStatusText(sale.status)}
                          </span>
                        </td>
                        <td className={`due-date ${dueDateClass}`}>
                          {formatDate(sale.due_date)}
                          {isAlert && <span className="alert-indicator">⚠️</span>}
                        </td>
                        <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                          {sale.status === 'PENDING' || sale.status === 'PARTIAL' ? (
                            <>
                              <button
                                className="btn-action btn-payment"
                                onClick={() => openPaymentModal(sale.id)}
                                title="Registrar pago"
                              >
                                💰 Pagar
                              </button>
                              {isAdmin() && (
                                <button
                                  className="btn-action btn-cancel-sale"
                                  onClick={() => handleCancelSale(sale.id, sale.product?.name)}
                                  title="Cancelar venta"
                                >
                                  ❌
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="no-actions">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de pago */}
      {showPaymentModal && selectedSale && (
        <PaymentModal
          sale={selectedSale}
          onSubmit={handleRegisterPayment}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedSale(null);
          }}
          isLoading={isSubmitting}
        />
      )}

      {/* Modal de Inversión */}
      {showInvestmentModal && (
        <InvestmentModal
          onSubmit={handleRegisterInvestment}
          onCancel={() => setShowInvestmentModal(false)}
          isLoading={isSubmitting}
        />
      )}

      {/* Modal de Detalles de Venta */}
      {showDetailsModal && saleDetails && (
        <SaleDetailsModal
          sale={saleDetails}
          onClose={() => {
            setShowDetailsModal(false);
            setSaleDetails(null);
          }}
        />
      )}
    </>
  );
};

export default SalesPage;
