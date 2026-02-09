import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import '../styles/pages/Login.css';
import loginBackground from '../assets/fondo_login.jpg';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({
    general: '',
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const clearError = (field) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ general: '', username: '', password: '' });
    setLoading(true);

    try {
      const response = await authService.login(username, password);
      login(response.access_token, response.user);
      navigate('/');
    } catch (err) {
      if (err.response?.status === 401) {
        setErrors(prev => ({ ...prev, general: 'Usuario o contraseña incorrectos' }));
      } else if (err.response?.status === 400) {
        setErrors(prev => ({ ...prev, general: err.response.data.detail || 'Usuario inactivo' }));
      } else {
        setErrors(prev => ({ ...prev, general: 'Error al iniciar sesión. Intenta de nuevo.' }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <img src={loginBackground} alt="Fondo" className="login-bg-image" />
        <div className="login-overlay"></div>
      </div>
      
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Iniciar Sesión</h1>
          <p className="login-subtitle">Bienvenido de vuelta</p>
          
          {errors.general && <div className="form-error-general">{errors.general}</div>}
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Usuario</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearError('username');
                  clearError('general');
                }}
                className={errors.username ? 'input-error' : ''}
                required
                placeholder="Ingresa tu usuario"
                autoComplete="username"
              />
              {errors.username && <span className="field-error">{errors.username}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError('password');
                  clearError('general');
                }}
                className={errors.password ? 'input-error' : ''}
                required
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>
            
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </form>
          
          <div className="login-footer">
            <p className="register-text-desktop">
              ¿No tienes cuenta? <Link to="/register" className="register-link">Crear cuenta</Link>
            </p>
            <Link to="/register" className="register-button-mobile">
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
