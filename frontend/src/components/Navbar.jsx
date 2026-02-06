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
          
          {isAuthenticated() ? (
            <>
              {/* Sección de Operaciones - Para todos los usuarios autenticados */}
              <div className="navbar-section">
                <button className="navbar-link" onClick={() => navigate('/sales')}>
                  Ventas
                </button>
              </div>

              {/* Sección de Gestión - Solo Admin */}
              {isAdmin() && (
                <div className="navbar-section navbar-admin">
                  <button className="navbar-link" onClick={() => navigate('/admin/products/create')}>
                    Productos
                  </button>
                  <button className="navbar-link" onClick={() => navigate('/sellers')}>
                    Vendedores
                  </button>
                  <button className="navbar-link" onClick={() => navigate('/earnings')}>
                    Ganancias
                  </button>
                </div>
              )}

              {/* Sección de Usuario */}
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
