import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/components/AdminNavbar.css';

const AdminNavbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <nav className="admin-navbar">
        <div className="admin-navbar-container">
          <div className="admin-brand" onClick={() => handleNavigate('/')}>
            Flores Artesanales
          </div>

          <button 
            className={`admin-hamburger ${isMenuOpen ? 'open' : ''}`} 
            onClick={toggleMenu}
            aria-label="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {isMenuOpen && (
          <div className="admin-menu-dropdown">
            <button className="admin-menu-item" onClick={() => handleNavigate('/')}>
              Inicio
            </button>
            
            <div className="admin-menu-divider"></div>
            
            <button className="admin-menu-item" onClick={() => handleNavigate('/sales')}>
              Ventas
            </button>
            
            <button className="admin-menu-item" onClick={() => handleNavigate('/admin/products/create')}>
              Productos
            </button>
            
            <button className="admin-menu-item" onClick={() => handleNavigate('/sellers')}>
              Vendedores
            </button>
            
            <button className="admin-menu-item" onClick={() => handleNavigate('/admin/users')}>
              Usuarios
            </button>
            
            <button className="admin-menu-item" onClick={() => handleNavigate('/earnings')}>
              Ganancias
            </button>
            
            <div className="admin-menu-divider"></div>
            
            <div className="admin-user-section">
              <div className="admin-user-info">
                <span className="admin-user-name">{user?.full_name || user?.username}</span>
                <span className="admin-user-role">Administrador</span>
              </div>
              <button className="admin-menu-item logout" onClick={handleLogout}>
                Salir
              </button>
            </div>
          </div>
        )}
      </nav>

      {isMenuOpen && <div className="admin-overlay" onClick={toggleMenu}></div>}
    </>
  );
};

export default AdminNavbar;
