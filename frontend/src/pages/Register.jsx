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
  const [errors, setErrors] = useState({
    general: '',
    username: '',
    email: '',
    full_name: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const clearError = (field) => {
    setErrors(prev => ({ ...prev, [field]: '', general: '' }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearError(name);
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
    setErrors({
      general: '',
      username: '',
      email: '',
      full_name: '',
      password: '',
      confirmPassword: ''
    });

    // Validaciones locales
    let hasError = false;
    const newErrors = {};

    if (!formData.username || formData.username.length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
      hasError = true;
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = 'El email no es válido';
      hasError = true;
    }

    if (!formData.full_name || formData.full_name.trim().length === 0) {
      newErrors.full_name = 'El nombre completo es requerido';
      hasError = true;
    }

    if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
      hasError = true;
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.hasUpperCase) {
        newErrors.password = 'La contraseña debe tener al menos una mayúscula';
        hasError = true;
      } else if (!passwordValidation.hasNumber) {
        newErrors.password = 'La contraseña debe tener al menos un número';
        hasError = true;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
      hasError = true;
    }

    if (hasError) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...userData } = formData;
      const response = await authService.register(userData);
      login(response.access_token, response.user);
      navigate('/');
    } catch (err) {
      // Manejar errores del backend
      if (err.response?.status === 400) {
        const detail = err.response.data.detail;
        
        if (detail.includes('usuario')) {
          setErrors(prev => ({ ...prev, username: detail }));
        } else if (detail.includes('email') || detail.includes('Email')) {
          setErrors(prev => ({ ...prev, email: detail }));
        } else {
          setErrors(prev => ({ ...prev, general: detail }));
        }
      } else if (err.response?.status === 422 && err.response?.data?.detail) {
        const detail = err.response.data.detail;
        
        if (Array.isArray(detail)) {
          // Errores de validación de Pydantic
          detail.forEach(error => {
            const field = error.loc?.[1]; // nombre del campo
            if (field && newErrors[field] !== undefined) {
              newErrors[field] = error.msg;
            } else {
              newErrors.general = error.msg;
            }
          });
          setErrors(prev => ({ ...prev, ...newErrors }));
        } else {
          setErrors(prev => ({ ...prev, general: detail }));
        }
      } else {
        setErrors(prev => ({ ...prev, general: 'Error al registrar usuario. Intenta nuevamente.' }));
      }
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
          
          {errors.general && <div className="form-error-general">{errors.general}</div>}
          
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label htmlFor="full_name">Nombre Completo</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={errors.full_name ? 'input-error' : ''}
                required
                placeholder="Tu nombre completo"
                autoComplete="name"
              />
              {errors.full_name && <span className="field-error">{errors.full_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="username">Usuario</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={errors.username ? 'input-error' : ''}
                required
                placeholder="Elige un nombre de usuario"
                autoComplete="username"
                minLength={3}
              />
              {errors.username && <span className="field-error">{errors.username}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'input-error' : ''}
                required
                placeholder="tu@email.com"
                autoComplete="email"
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'input-error' : ''}
                required
                placeholder="Mínimo 8 caracteres, 1 mayúscula, 1 número"
                autoComplete="new-password"
                minLength={8}
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'input-error' : ''}
                required
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
              />
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
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
