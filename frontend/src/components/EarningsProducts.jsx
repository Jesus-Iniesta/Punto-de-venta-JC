import { useState, useEffect } from 'react';
import earningsService from '../services/earningsService';
import '../styles/components/EarningsProducts.css';

const EarningsProducts = () => {
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [orderBy, setOrderBy] = useState('profit');
  const [editingEarning, setEditingEarning] = useState(null);
  const [editForm, setEditForm] = useState({ costPrice: '', salePrice: '' });

  useEffect(() => {
    loadEarnings();
  }, [orderBy]);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await earningsService.getByProduct(orderBy);
      setEarnings(data);
    } catch (err) {
      console.error('Error al cargar earnings:', err);
      setError('Error al cargar los datos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEarning = (earning) => {
    setEditingEarning(earning);
    setEditForm({
      costPrice: (earning.total_invested / earning.quantity_sold).toFixed(2),
      salePrice: (earning.total_generated / earning.quantity_sold).toFixed(2)
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
      await loadEarnings();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error al actualizar earning:', err);
      setError(err.response?.data?.detail || 'Error al actualizar el earning');
    }
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="earnings-products-container">
        <div className="loading-state">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="earnings-products-container">
      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}
      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      <div className="products-header">
        <h2>Ganancias por Producto</h2>
        <div className="filter-group">
          <label htmlFor="orderBy">Ordenar por:</label>
          <select
            id="orderBy"
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value)}
            className="filter-select"
          >
            <option value="profit">Mayor ganancia</option>
            <option value="quantity">Más vendidos</option>
            <option value="margin">Mejor margen</option>
          </select>
        </div>
      </div>

      <p className="help-text">
        Edita los precios de costo y venta para corregir errores. Los totales se recalcularán automáticamente.
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
                <th>Cantidad</th>
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
                    {earning.profit >= 0 ? '+' : ''}{formatCurrency(earning.profit)}
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
                          placeholder="Costo"
                          value={editForm.costPrice}
                          onChange={(e) => setEditForm({ ...editForm, costPrice: e.target.value })}
                          className="mini-input"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Venta"
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
  );
};

export default EarningsProducts;
