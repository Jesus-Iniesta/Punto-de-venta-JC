import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminNavbar from './AdminNavbar';
import '../styles/components/Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  // Usar AdminNavbar para usuarios admin
  if (isAuthenticated() && isAdmin()) {
    return <AdminNavbar />;
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand - Lado izquierdo */}
        <div className="navbar-brand" onClick={() => navigate('/')}>
          Flores Artesanales
        </div>

        {/* Menú - Lado derecho */}
        <div className="navbar-menu">
          {/* Opciones públicas */}
          <button className="navbar-link" onClick={() => { scrollToTop(); navigate('/'); }}>
            Inicio
          </button>
          
          {/* Contáctanos - Solo para guests y users (NO admin) */}
          {!isAdmin() && (
            <button className="navbar-link" onClick={() => navigate('/contact')}>
              Contáctanos
            </button>
          )}
          
          {isAuthenticated() ? (
            <>
              {/* Sección de Usuario - Solo para usuarios no admin */}
              <div className="navbar-section navbar-user">
                <span className="navbar-username">{user?.full_name || user?.username}</span>
                <button className="navbar-link navbar-logout" onClick={handleLogout}>
                  Salir
                </button>
              </div>
            </>
          ) : (
            <>
              <button className="navbar-link" onClick={handleLogin}>
                Iniciar sesión
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
