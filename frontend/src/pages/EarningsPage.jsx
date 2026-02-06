import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import earningsService from '../services/earningsService';
import '../styles/pages/EarningsPage.css';

const EarningsPage = () => {
  const { isAdmin } = useAuth();
  const [investments, setInvestments] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('investments'); // 'investments' o 'earnings'
  const [editingEarning, setEditingEarning] = useState(null);
  const [editForm, setEditForm] = useState({ costPrice: '', salePrice: '' });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'investments') {
        const investmentsData = await earningsService.getInvestments();
        setInvestments(investmentsData);
      } else {
        const earningsData = await earningsService.getByProduct();
        setEarnings(earningsData);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los datos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEarning = (earning) => {
    setEditingEarning(earning);
    setEditForm({
      costPrice: earning.total_invested / earning.quantity_sold,
      salePrice: earning.total_generated / earning.quantity_sold
    });
  };

  const handleSaveEdit = async (earningId) => {
    try {
      setError(null);
      
      const costPrice = parseFloat(editForm.costPrice);
      const salePrice = parseFloat(editForm.salePrice);

      if (isNaN(costPrice) || costPrice <= 0 || isNaN(salePrice) || salePrice <= 0) {
        setError('Los precios deben ser mayores a 0');
        return;
      }

      await earningsService.updateEarning(earningId, costPrice, salePrice);
      setSuccessMessage('Earning actualizado exitosamente');
      setEditingEarning(null);
      await loadData();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error al actualizar earning:', err);
      setError(err.response?.data?.detail || 'Error al actualizar el earning');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  if (!isAdmin()) {
    return (
      <>
        <Navbar />
        <div className="earnings-page">
          <div className="access-denied">
            <h2>Acceso Denegado</h2>
            <p>Solo los administradores pueden acceder a esta sección.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="earnings-page">
        <div className="earnings-container">
          <div className="earnings-header">
            <h1 className="earnings-title">Gestión de Ganancias</h1>
            <p className="earnings-subtitle">Administra inversiones y corrige errores en registros</p>
          </div>

          {/* Mensajes */}
          {successMessage && (
            <div className="alert alert-success">{successMessage}</div>
          )}
          {error && (
            <div className="alert alert-error">{error}</div>
          )}

          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'investments' ? 'active' : ''}`}
              onClick={() => setActiveTab('investments')}
            >
              Inversiones Iniciales
            </button>
            <button
              className={`tab ${activeTab === 'earnings' ? 'active' : ''}`}
              onClick={() => setActiveTab('earnings')}
            >
              Earnings por Producto
            </button>
          </div>

          {/* Contenido de tabs */}
          {loading ? (
            <div className="loading-state">
              <p>Cargando datos...</p>
            </div>
          ) : (
            <>
              {/* Tab de Inversiones */}
              {activeTab === 'investments' && (
                <div className="tab-content">
                  <div className="investments-section">
                    <h2>Historial de Inversiones</h2>
                    {investments.length === 0 ? (
                      <div className="empty-state">
                        <p>No hay inversiones registradas aún.</p>
                      </div>
                    ) : (
                      <div className="table-container">
                        <table className="earnings-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Fecha</th>
                              <th>Monto</th>
                              <th>Descripción</th>
                              <th>Registrado por</th>
                              <th>Fecha de Registro</th>
                            </tr>
                          </thead>
                          <tbody>
                            {investments.map((investment) => (
                              <tr key={investment.id}>
                                <td>{investment.id}</td>
                                <td>{formatDate(investment.date)}</td>
                                <td className="amount success">{formatCurrency(investment.amount)}</td>
                                <td className="description">{investment.description}</td>
                                <td>{investment.registered_by}</td>
                                <td>{formatDate(investment.created_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan="2"><strong>Total Invertido:</strong></td>
                              <td className="amount total" colSpan="4">
                                <strong>
                                  {formatCurrency(
                                    investments.reduce((sum, inv) => sum + inv.amount, 0)
                                  )}
                                </strong>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab de Earnings */}
              {activeTab === 'earnings' && (
                <div className="tab-content">
                  <div className="earnings-section">
                    <h2>Earnings por Producto</h2>
                    <p className="help-text">
                      Puedes editar los precios de costo y venta para corregir errores.
                      Los totales se recalcularán automáticamente.
                    </p>
                    {earnings.length === 0 ? (
                      <div className="empty-state">
                        <p>No hay registros de earnings aún.</p>
                      </div>
                    ) : (
                      <div className="table-container">
                        <table className="earnings-table">
                          <thead>
                            <tr>
                              <th>Producto</th>
                              <th>Cantidad Vendida</th>
                              <th>Invertido</th>
                              <th>Generado</th>
                              <th>Ganancia</th>
                              <th>Margen %</th>
                              <th>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {earnings.map((earning) => (
                              <tr key={earning.product_id}>
                                <td className="product-name">{earning.product_name}</td>
                                <td>{earning.quantity_sold}</td>
                                <td className="amount">{formatCurrency(earning.total_invested)}</td>
                                <td className="amount success">{formatCurrency(earning.total_generated)}</td>
                                <td className={`amount ${earning.profit >= 0 ? 'profit' : 'loss'}`}>
                                  {formatCurrency(earning.profit)}
                                </td>
                                <td className={earning.profit_margin >= 0 ? 'success' : 'error'}>
                                  {earning.profit_margin.toFixed(1)}%
                                </td>
                                <td className="actions-cell">
                                  {editingEarning?.product_id === earning.product_id ? (
                                    <div className="edit-form">
                                      <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Precio costo"
                                        value={editForm.costPrice}
                                        onChange={(e) => setEditForm({ ...editForm, costPrice: e.target.value })}
                                        className="mini-input"
                                      />
                                      <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Precio venta"
                                        value={editForm.salePrice}
                                        onChange={(e) => setEditForm({ ...editForm, salePrice: e.target.value })}
                                        className="mini-input"
                                      />
                                      <button
                                        className="btn-save-small"
                                        onClick={() => handleSaveEdit(earning.product_id)}
                                      >
                                        ✓
                                      </button>
                                      <button
                                        className="btn-cancel-small"
                                        onClick={() => setEditingEarning(null)}
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      className="btn-edit-small"
                                      onClick={() => handleEditEarning(earning)}
                                      title="Editar precios"
                                    >
                                      Editar
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default EarningsPage;
