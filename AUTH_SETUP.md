# Sistema de Autenticación - Punto de Venta

## Configuración

### Backend (FastAPI)

1. Instalar dependencias:
```bash
cd backend
pip install -r requirements.txt
```

2. Configurar variables de entorno en `.env`:
```
DATABASE_URL=postgresql://user:password@localhost/dbname
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

3. Ejecutar migraciones:
```bash
alembic upgrade head
```

4. Iniciar servidor:
```bash
uvicorn main:app --reload
```

### Frontend (React)

1. Instalar dependencias:
```bash
cd frontend
pnpm install
```

2. Configurar variables de entorno en `.env`:
```
VITE_API_URL=http://localhost:8000/api/v1
```

3. Iniciar servidor de desarrollo:
```bash
pnpm dev
```

## Funcionalidades Implementadas

### Backend
- ✅ Modelo de Usuario con campo `role` (admin | user)
- ✅ Endpoint `/api/v1/auth/login` - Login con JWT
- ✅ Endpoint `/api/v1/auth/register` - Registro de usuarios
- ✅ Hash de contraseñas con bcrypt
- ✅ Validación de tokens JWT
- ✅ Dependencias para obtener usuario actual
- ✅ Dependencia `require_admin` para rutas protegidas

### Frontend
- ✅ React Router configurado
- ✅ AuthContext para manejo de estado global
- ✅ Página de Login con diseño profesional
- ✅ Página de Register
- ✅ Navbar dinámico según rol del usuario
- ✅ Almacenamiento seguro de token (localStorage)
- ✅ Servicios de API configurados
- ✅ ProtectedRoute para rutas protegidas

## Uso

### Crear un usuario admin

Puedes crear un usuario admin directamente en la base de datos o usando un script de seeding.

### Roles

- **user**: Usuario normal, solo ve el Home
- **admin**: Acceso a Panel, Subir artículos y Gestión (por ahora solo visual)

## Estructura de Respuesta del Login

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "usuario",
    "email": "user@example.com",
    "full_name": "Nombre Usuario",
    "role": "user",
    "is_active": true,
    "created_at": "2026-02-03T12:00:00"
  }
}
```

## Próximos Pasos

- Implementar funcionalidad real del panel de admin
- Sistema de subida de artículos
- Gestión de productos
- Perfiles de usuario
