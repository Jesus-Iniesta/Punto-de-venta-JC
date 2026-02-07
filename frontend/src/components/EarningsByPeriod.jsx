import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import earningsService from '../services/earningsService';
import '../styles/components/EarningsByPeriod.css';

const EarningsByPeriod = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('day');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [chartType, setChartType] = useState('line');

  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadData();
    }
  }, [period, startDate, endDate]);

  const loadData = async () => {
    // Validar que las fechas estén presentes
    if (!startDate || !endDate) {
      setError('Por favor selecciona un rango de fechas válido.');
      setLoading(false);
      return;
    }

    // Validar que start_date no sea posterior a end_date
    if (new Date(startDate) > new Date(endDate)) {
      setError('La fecha inicial no puede ser posterior a la fecha final.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await earningsService.getByPeriod(period, startDate, endDate);
      setData(result);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      const errorMsg = err.response?.data?.detail || 'Error al cargar los datos. Por favor, intenta de nuevo.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    if (data.length === 0) return { revenue: 0, cost: 0, profit: 0, margin: 0, sales: 0 };
    
    return data.reduce((acc, item) => ({
      revenue: acc.revenue + item.total_revenue,
      cost: acc.cost + item.total_cost,
      profit: acc.profit + item.profit,
      sales: acc.sales + item.sales_count
    }), { revenue: 0, cost: 0, profit: 0, sales: 0 });
  };

  const totals = calculateTotals();
  const avgMargin = totals.revenue > 0 ? ((totals.profit / totals.revenue) * 100) : 0;

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const formatChartData = () => {
    return data.map(item => ({
      name: new Date(item.start_date).toLocaleDateString('es-ES', { 
        month: 'short', 
        day: 'numeric' 
      }),
      ganancia: parseFloat(item.profit.toFixed(2)),
      ingresos: parseFloat(item.total_revenue.toFixed(2)),
      costos: parseFloat(item.total_cost.toFixed(2))
    }));
  };

  if (loading) {
    return (
      <div className="earnings-period-container">
        <div className="loading-state">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="earnings-period-container">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="period-header">
        <h2>Ganancias por Período</h2>
      </div>

      <div className="filters-row">
        <div className="filter-group">
          <label>Período:</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="filter-select">
            <option value="day">Diario</option>
            <option value="week">Semanal</option>
            <option value="month">Mensual</option>
            <option value="year">Anual</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Desde:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="date-input"
          />
        </div>

        <div className="filter-group">
          <label>Hasta:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="date-input"
          />
        </div>

        <div className="filter-group">
          <label>Gráfica:</label>
          <select value={chartType} onChange={(e) => setChartType(e.target.value)} className="filter-select">
            <option value="line">Línea</option>
            <option value="bar">Barras</option>
          </select>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-label">Total Ingresos</div>
          <div className="card-value success">{formatCurrency(totals.revenue)}</div>
        </div>
        <div className="summary-card">
          <div className="card-label">Total Costos</div>
          <div className="card-value">{formatCurrency(totals.cost)}</div>
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
        <div className="summary-card">
          <div className="card-label">Total Ventas</div>
          <div className="card-value">{totals.sales}</div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="empty-state">
          <p>No hay datos para el período seleccionado.</p>
        </div>
      ) : (
        <>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={350}>
              {chartType === 'line' ? (
                <LineChart data={formatChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" stroke="#666" style={{ fontSize: '0.875rem' }} />
                  <YAxis stroke="#666" style={{ fontSize: '0.875rem' }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'white', 
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px' 
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="ganancia" 
                    stroke="#84A98C" 
                    strokeWidth={2}
                    dot={{ fill: '#84A98C', r: 4 }}
                    name="Ganancia"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ingresos" 
                    stroke="#E29595" 
                    strokeWidth={2}
                    dot={{ fill: '#E29595', r: 4 }}
                    name="Ingresos"
                  />
                </LineChart>
              ) : (
                <BarChart data={formatChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" stroke="#666" style={{ fontSize: '0.875rem' }} />
                  <YAxis stroke="#666" style={{ fontSize: '0.875rem' }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'white', 
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px' 
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="ganancia" fill="#84A98C" name="Ganancia" />
                  <Bar dataKey="ingresos" fill="#E29595" name="Ingresos" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="table-container">
            <table className="period-table">
              <thead>
                <tr>
                  <th>Período</th>
                  <th>Ingresos</th>
                  <th>Costos</th>
                  <th>Ganancia</th>
                  <th>Margen %</th>
                  <th>Ventas</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index}>
                    <td className="period-date">
                      {new Date(item.start_date).toLocaleDateString('es-ES')}
                    </td>
                    <td className="amount success">{formatCurrency(item.total_revenue)}</td>
                    <td className="amount">{formatCurrency(item.total_cost)}</td>
                    <td className={`amount ${item.profit >= 0 ? 'profit' : 'loss'}`}>
                      {item.profit >= 0 ? '+' : ''}{formatCurrency(item.profit)}
                    </td>
                    <td className={item.profit_margin >= 0 ? 'success' : 'error'}>
                      {item.profit_margin.toFixed(1)}%
                    </td>
                    <td>{item.sales_count}</td>
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

export default EarningsByPeriod;
