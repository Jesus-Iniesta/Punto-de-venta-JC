import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import SellerForm from '../components/SellerForm';
import sellersService from '../services/sellersService';
import '../styles/pages/SellersPage.css';

const SellersPage = () => {
  const { isAdmin } = useAuth();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSeller, setEditingSeller] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Cargar vendedores al montar el componente
  useEffect(() => {
    loadSellers();
  }, []);

  const loadSellers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sellersService.getAllSellers(0, 100);
      setSellers(data);
    } catch (err) {
      console.error('Error al cargar vendedores:', err);
      setError('No se pudieron cargar los vendedores. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setEditingSeller(null);
    setShowForm(true);
    setSuccessMessage('');
  };

  const handleEditClick = (seller) => {
    setEditingSeller(seller);
    setShowForm(true);
    setSuccessMessage('');
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingSeller(null);
  };

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (editingSeller) {
        // Actualizar vendedor existente
        await sellersService.updateSeller(editingSeller.id, formData);
        setSuccessMessage('Vendedor actualizado exitosamente');
      } else {
        // Crear nuevo vendedor
        await sellersService.createSeller(formData);
        setSuccessMessage('Vendedor creado exitosamente');
      }

      setShowForm(false);
      setEditingSeller(null);
      await loadSellers();
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error al guardar vendedor:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Error al guardar el vendedor. Por favor, intenta de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (sellerId, sellerName) => {
    if (window.confirm(`¿Estás seguro de desactivar al vendedor "${sellerName}"?`)) {
      try {
        setError(null);
        await sellersService.deleteSeller(sellerId);
        setSuccessMessage('Vendedor desactivado exitosamente');
        await loadSellers();
        
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error al desactivar vendedor:', err);
        if (err.response?.data?.detail) {
          setError(err.response.data.detail);
        } else {
          setError('Error al desactivar el vendedor. Por favor, intenta de nuevo.');
        }
      }
    }
  };

  return (
    <>
      <Navbar />
      <div className="sellers-page">
        <div className="sellers-container">
          <div className="sellers-header">
            <h1 className="sellers-title">Gestión de Vendedores</h1>
            {isAdmin() && !showForm && (
              <button className="btn-create" onClick={handleCreateClick}>
                + Agregar Vendedor
              </button>
            )}
          </div>

          {/* Mensajes de éxito y error */}
          {successMessage && (
            <div className="alert alert-success">
              {successMessage}
            </div>
          )}
          
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {/* Formulario de creación/edición */}
          {showForm && isAdmin() && (
            <SellerForm
              seller={editingSeller}
              onSubmit={handleSubmit}
              onCancel={handleCancelForm}
              isLoading={isSubmitting}
            />
          )}

          {/* Tabla de vendedores */}
          {loading ? (
            <div className="loading-container">
              <p>Cargando vendedores...</p>
            </div>
          ) : sellers.length === 0 ? (
            <div className="empty-state">
              <p>No hay vendedores registrados</p>
              {isAdmin() && (
                <button className="btn-create-alt" onClick={handleCreateClick}>
                  Crear primer vendedor
                </button>
              )}
            </div>
          ) : (
            <div className="sellers-table-container">
              <table className="sellers-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Contacto</th>
                    <th>Estado</th>
                    <th>Fecha de Registro</th>
                    {isAdmin() && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {sellers.map((seller) => (
                    <tr key={seller.id} className={!seller.is_active ? 'inactive-row' : ''}>
                      <td>{seller.id}</td>
                      <td className="seller-name">{seller.name}</td>
                      <td className="seller-contact">
                        {seller.contact_info || <span className="no-data">Sin información</span>}
                      </td>
                      <td>
                        <span className={`status-badge ${seller.is_active ? 'active' : 'inactive'}`}>
                          {seller.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="seller-date">
                        {new Date(seller.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </td>
                      {isAdmin() && (
                        <td className="actions-cell">
                          <button
                            className="btn-action btn-edit"
                            onClick={() => handleEditClick(seller)}
                            title="Editar vendedor"
                          >
                            ✏️ Editar
                          </button>
                          {seller.is_active && (
                            <button
                              className="btn-action btn-delete"
                              onClick={() => handleDelete(seller.id, seller.name)}
                              title="Desactivar vendedor"
                            >
                              🚫 Desactivar
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SellersPage;
