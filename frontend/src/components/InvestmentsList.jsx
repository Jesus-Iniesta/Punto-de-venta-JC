import { useState, useEffect } from 'react';
import earningsService from '../services/earningsService';
import '../styles/components/InvestmentsList.css';

const InvestmentsList = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await earningsService.getInvestments();
      setInvestments(data);
    } catch (err) {
      console.error('Error al cargar inversiones:', err);
      setError('Error al cargar los datos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="investments-list-container">
        <div className="loading-state">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="investments-list-container">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="investments-header">
        <h2>Historial de Inversiones Iniciales</h2>
        <p className="subtitle">Capital invertido en productos e inicio del negocio</p>
      </div>

      {investments.length === 0 ? (
        <div className="empty-state">
          <p>No hay inversiones registradas aún.</p>
        </div>
      ) : (
        <>
          <div className="summary-card">
            <div className="card-label">Total Invertido</div>
            <div className="card-value">
              {formatCurrency(investments.reduce((sum, inv) => sum + inv.amount, 0))}
            </div>
          </div>

          <div className="table-container">
            <table className="investments-table">
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
                    <td className="date-cell">{formatDate(investment.date)}</td>
                    <td className="amount success">{formatCurrency(investment.amount)}</td>
                    <td className="description">{investment.description}</td>
                    <td>{investment.registered_by}</td>
                    <td className="date-cell">{formatDate(investment.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default InvestmentsList;
