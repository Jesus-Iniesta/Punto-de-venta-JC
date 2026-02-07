import { useState, useEffect } from 'react';
import { sellersService } from '../services/sellersService';
import '../styles/pages/ContactPage.css';

const ContactPage = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mapeo de ID de vendedor a número de WhatsApp (hardcoded)
  const phoneNumbers = {
    1: "527292709689",
    2: "5217226786551",
    3: "5215598765432"
  };

  useEffect(() => {
    loadSellers();
  }, []);

  const loadSellers = async () => {
    try {
      setLoading(true);
      const data = await sellersService.getAllSellers();
      // Filtrar solo vendedores activos
      const activeSellers = data.filter(seller => seller.is_active);
      setSellers(activeSellers);
    } catch (err) {
      setError('Error al cargar los vendedores');
      console.error('Error loading sellers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = (sellerId) => {
    const phone = phoneNumbers[sellerId];
    if (phone) {
      window.open(`https://wa.me/${phone}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="contact-page">
        <div className="contact-container">
          <div className="contact-loading">Cargando vendedores...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="contact-page">
        <div className="contact-container">
          <div className="contact-error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-page">
      <div className="contact-container">
        <div className="contact-header">
          <h1 className="contact-title">Contáctanos</h1>
          <p className="contact-subtitle">
            Nuestro equipo está listo para ayudarte
          </p>
        </div>

        {sellers.length === 0 ? (
          <div className="contact-empty">
            <p>No hay vendedores disponibles en este momento</p>
          </div>
        ) : (
          <div className="sellers-grid">
            {sellers.map((seller) => (
              <div key={seller.id} className="seller-card">
                <h2 className="seller-name">{seller.name}</h2>
                <p className="seller-info">{seller.contact_info || 'Vendedor disponible'}</p>
                {phoneNumbers[seller.id] && (
                  <button 
                    onClick={() => handleContact(seller.id)}
                    className="contact-button"
                  >
                    Contactar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactPage;

