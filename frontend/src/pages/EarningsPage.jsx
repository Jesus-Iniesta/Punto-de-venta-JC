import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import InvestmentsList from '../components/InvestmentsList';
import EarningsProducts from '../components/EarningsProducts';
import EarningsByPeriod from '../components/EarningsByPeriod';
import EarningsBySeller from '../components/EarningsBySeller';
import '../styles/pages/EarningsPage.css';

const EarningsPage = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('investments');

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
            <p className="earnings-subtitle">Análisis completo de rentabilidad del negocio</p>
          </div>

          <div className="tabs">
            <button
              className={`tab ${activeTab === 'investments' ? 'active' : ''}`}
              onClick={() => setActiveTab('investments')}
            >
              Inversiones
            </button>
            <button
              className={`tab ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              Por Producto
            </button>
            <button
              className={`tab ${activeTab === 'period' ? 'active' : ''}`}
              onClick={() => setActiveTab('period')}
            >
              Por Período
            </button>
            <button
              className={`tab ${activeTab === 'seller' ? 'active' : ''}`}
              onClick={() => setActiveTab('seller')}
            >
              Por Vendedor
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'investments' && <InvestmentsList />}
            {activeTab === 'products' && <EarningsProducts />}
            {activeTab === 'period' && <EarningsByPeriod />}
            {activeTab === 'seller' && <EarningsBySeller />}
          </div>
        </div>
      </div>
    </>
  );
};

export default EarningsPage;
