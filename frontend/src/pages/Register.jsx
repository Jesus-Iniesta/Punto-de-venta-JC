import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import '../styles/pages/Register.css';
import registerBackground from '../assets/fondo_login.jpg';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return { hasUpperCase, hasNumber };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.username || formData.username.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('El email no es válido');
      return;
    }

    if (!formData.full_name || formData.full_name.trim().length === 0) {
      setError('El nombre completo es requerido');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.hasUpperCase) {
      setError('La contraseña debe tener al menos una mayúscula');
      return;
    }

    if (!passwordValidation.hasNumber) {
      setError('La contraseña debe tener al menos un número');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...userData } = formData;
      const response = await authService.register(userData);
      login(response.access_token, response.user);
      navigate('/');
    } catch (err) {
      // Manejar errores de validación de Pydantic (422)
      if (err.response?.status === 422 && err.response?.data?.detail) {
        const detail = err.response.data.detail;
        
        // Si detail es un array (errores de Pydantic)
        if (Array.isArray(detail)) {
          const errorMessages = detail.map(error => error.msg).join('. ');
          setError(errorMessages);
        } else if (typeof detail === 'string') {
          setError(detail);
        } else {
          setError('Error de validación en los datos ingresados');
        }
      } else if (err.response?.data?.detail) {
        // Otros errores con detail string
        setError(typeof err.response.data.detail === 'string' 
          ? err.response.data.detail 
          : 'Error al registrar usuario');
      } else {
        setError('Error al registrar usuario. Intenta nuevamente.');
      }
      console.error('Error de registro:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-background">
        <img src={registerBackground} alt="Fondo" className="register-bg-image" />
        <div className="register-overlay"></div>
      </div>
      
      <div className="register-container">
        <div className="register-card">
          <h1 className="register-title">Crear Cuenta</h1>
          <p className="register-subtitle">Únete a nuestra comunidad</p>
          
          {error && <div className="register-error">{error}</div>}
          
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label htmlFor="full_name">Nombre Completo</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                placeholder="Tu nombre completo"
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Usuario</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Elige un nombre de usuario"
                autoComplete="username"
                minLength={3}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
              />
            </div>
            
            <button type="submit" className="register-button" disabled={loading}>
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </form>
          
          <div className="register-footer">
            <p className="login-text">
              ¿Ya tienes cuenta? <Link to="/login" className="login-link">Iniciar sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
