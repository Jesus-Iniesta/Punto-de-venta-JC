import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/components/Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

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
        <div className="navbar-brand" onClick={() => navigate('/')}>
          Flores Artesanales
        </div>
        <div className="navbar-menu">
          <button className="navbar-link" onClick={scrollToTop}>
            Inicio
          </button>
          
          {isAuthenticated() ? (
            <>
              {isAdmin() && (
                <>
                  <button className="navbar-link">
                    Panel
                  </button>
                  <button className="navbar-link">
                    Subir artículos
                  </button>
                  <button className="navbar-link">
                    Gestión
                  </button>
                </>
              )}
              <span className="navbar-username">{user?.full_name || user?.username}</span>
              <button className="navbar-link navbar-logout" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <button className="navbar-link" onClick={handleLogin}>
                Iniciar sesión
              </button>
              <button className="navbar-link navbar-contact">
                Contáctanos
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
