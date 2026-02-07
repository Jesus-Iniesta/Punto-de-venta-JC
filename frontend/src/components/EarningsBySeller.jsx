import { useState, useEffect } from 'react';
import earningsService from '../services/earningsService';
import '../styles/components/EarningsBySeller.css';

const EarningsBySeller = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await earningsService.getBySeller();
      setSellers(data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los datos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    if (sellers.length === 0) return { sales: 0, revenue: 0, cost: 0, profit: 0 };
    
    return sellers.reduce((acc, seller) => ({
      sales: acc.sales + seller.total_sales,
      revenue: acc.revenue + seller.total_revenue,
      cost: acc.cost + seller.total_cost,
      profit: acc.profit + seller.profit
    }), { sales: 0, revenue: 0, cost: 0, profit: 0 });
  };

  const totals = calculateTotals();
  const avgMargin = totals.revenue > 0 ? ((totals.profit / totals.revenue) * 100) : 0;

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const getSellerMargin = (seller) => {
    return seller.total_revenue > 0 
      ? ((seller.profit / seller.total_revenue) * 100) 
      : 0;
  };

  if (loading) {
    return (
      <div className="earnings-seller-container">
        <div className="loading-state">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="earnings-seller-container">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="seller-header">
        <h2>Ganancias por Vendedor</h2>
        <p className="subtitle">Ranking de rendimiento por vendedor</p>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-label">Total Ventas</div>
          <div className="card-value">{totals.sales}</div>
        </div>
        <div className="summary-card">
          <div className="card-label">Ingresos Totales</div>
          <div className="card-value success">{formatCurrency(totals.revenue)}</div>
        </div>
        <div className="summary-card">
          <div className="card-label">Ganancia Total</div>
          <div className={`card-value ${totals.profit >= 0 ? 'profit' : 'loss'}`}>
            {totals.profit >= 0 ? '+' : ''}{formatCurrency(totals.profit)}
          </div>
        </div>
        <div className="summary-card">
          <div className="card-label">Margen Promedio</div>
          <div className={`card-value ${avgMargin >= 0 ? 'success' : 'error'}`}>
            {avgMargin.toFixed(1)}%
          </div>
        </div>
      </div>

      {sellers.length === 0 ? (
        <div className="empty-state">
          <p>No hay datos de vendedores disponibles.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="seller-table">
            <thead>
              <tr>
                <th>Posición</th>
                <th>Vendedor</th>
                <th>Ventas</th>
                <th>Ingresos</th>
                <th>Costos</th>
                <th>Ganancia</th>
                <th>Margen %</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((seller, index) => (
                <tr key={seller.seller_id}>
                  <td className="position">
                    <div className={`rank-badge rank-${index + 1}`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="seller-name">{seller.seller_name}</td>
                  <td className="sales-count">{seller.total_sales}</td>
                  <td className="amount success">{formatCurrency(seller.total_revenue)}</td>
                  <td className="amount">{formatCurrency(seller.total_cost)}</td>
                  <td className={`amount ${seller.profit >= 0 ? 'profit' : 'loss'}`}>
                    {seller.profit >= 0 ? '+' : ''}{formatCurrency(seller.profit)}
                  </td>
                  <td className={getSellerMargin(seller) >= 0 ? 'success' : 'error'}>
                    {getSellerMargin(seller).toFixed(1)}%
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

export default EarningsBySeller;
