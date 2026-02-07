import { useNavigate } from 'react-router-dom';
import '../styles/components/AuthRequiredModal.css';

const AuthRequiredModal = ({ onClose }) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    onClose();
    navigate('/login');
  };

  const handleRegister = () => {
    onClose();
    navigate('/register');
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>×</button>
        
        <div className="auth-modal-body">
          <h2>Inicia sesión para continuar</h2>
          <p>Crea una cuenta o inicia sesión para ver los detalles del producto</p>
          
          <div className="auth-modal-actions">
            <button onClick={handleLogin} className="btn-login">
              Iniciar sesión
            </button>
            <button onClick={handleRegister} className="btn-register">
              Crear cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthRequiredModal;
