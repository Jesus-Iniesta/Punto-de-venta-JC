# Backend - Sistema Punto de Venta

API REST desarrollada con FastAPI para sistema de punto de venta.

## 🚀 Características

- ✅ Autenticación JWT con roles (admin/user)
- ✅ CRUD completo de Usuarios
- ✅ CRUD completo de Productos con control de inventario
- ✅ Sistema de Ventas con múltiples estados (PENDING, PARTIAL, COMPLETED, CANCELLED)
- ✅ Sistema de Ganancias con reportes detallados
- ✅ Gestión de Vendedores
- ✅ Migraciones de base de datos con Alembic
- ✅ Seeders para datos iniciales

## 📋 Requisitos

- Python 3.9+
- PostgreSQL
- pip o poetry

## 🔧 Instalación

### 1. Clonar el repositorio
```bash
git clone <repo-url>
cd PuntoVenta/backend
```

### 2. Crear entorno virtual
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno
Crea un archivo `.env` en el directorio `backend/` con:

```env
DATABASE_URL=postgresql://usuario:password@localhost/punto_venta
SECRET_KEY=tu_clave_secreta_super_segura_aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 5. Ejecutar migraciones
```bash
alembic upgrade head
```

### 6. Poblar base de datos con datos iniciales (opcional)
```bash
python seed.py
```

Esto creará:
- Usuario admin (username: `admin`, password: `Admin123`)
- Usuario de prueba (username: `usuario`, password: `Usuario123`)
- 3 vendedores de prueba
- 8 productos de prueba

Ver más detalles en [SEEDERS.md](SEEDERS.md)

## 🏃‍♂️ Ejecutar el servidor

### Modo desarrollo
```bash
uvicorn main:app --reload
```

El servidor estará disponible en: `http://localhost:8000`

### Documentación interactiva
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 📚 Estructura del Proyecto

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── auth.py          # Autenticación
│   │       │   ├── users.py         # CRUD usuarios
│   │       │   ├── products.py      # CRUD productos
│   │       │   ├── sales.py         # CRUD ventas
│   │       │   ├── earnings.py      # Reportes de ganancias
│   │       │   └── sellers.py       # CRUD vendedores
│   │       └── api.py               # Router principal
│   ├── core/
│   │   ├── config.py                # Configuración
│   │   ├── security.py              # JWT y hashing
│   │   └── dependencies.py          # Dependencies de FastAPI
│   ├── db/
│   │   ├── base.py                  # Base de SQLAlchemy
│   │   ├── database.py              # Conexión a BD
│   │   └── seeders.py               # Datos iniciales
│   ├── models/                      # Modelos SQLAlchemy
│   └── schemas/                     # Schemas Pydantic
├── alembic/                         # Migraciones
│   └── versions/
├── main.py                          # Punto de entrada
├── seed.py                          # Script de seeders
└── requirements.txt
```

## 🔐 Autenticación

### Login
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=Admin123"
```

Respuesta:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Usar el token
```bash
curl -X GET "http://localhost:8000/api/v1/users/me" \
  -H "Authorization: Bearer <tu_token_aqui>"
```

## 📖 Endpoints Principales

### Autenticación (`/api/v1/auth`)
- `POST /login` - Iniciar sesión
- `POST /logout` - Cerrar sesión
- `POST /refresh` - Renovar token
- `POST /forgot-password` - Solicitar recuperación
- `POST /reset-password` - Resetear contraseña

### Usuarios (`/api/v1/users`)
- `POST /` - Crear usuario (admin)
- `GET /` - Listar usuarios (admin)
- `GET /me` - Obtener usuario actual
- `PUT /me` - Actualizar perfil
- `GET /{user_id}` - Obtener usuario (admin)
- `PUT /{user_id}` - Actualizar usuario (admin)
- `DELETE /{user_id}` - Eliminar usuario (admin)

### Productos (`/api/v1/products`)
- `POST /` - Crear producto
- `GET /` - Listar productos (con filtros)
- `GET /{product_id}` - Obtener producto
- `PUT /{product_id}` - Actualizar producto
- `DELETE /{product_id}` - Eliminar producto
- `PATCH /{product_id}/stock` - Ajustar stock

### Ventas (`/api/v1/sales`)
- `POST /` - Crear venta
- `GET /` - Listar ventas (con filtros)
- `GET /{sale_id}` - Obtener venta
- `PUT /{sale_id}` - Actualizar venta
- `PATCH /{sale_id}/payment` - Registrar pago
- `PATCH /{sale_id}/status` - Cambiar estado
- `DELETE /{sale_id}` - Cancelar venta

### Ganancias (`/api/v1/earnings`)
- `POST /investment` - Registrar inversión
- `GET /summary` - Resumen general
- `GET /by-product` - Ganancias por producto
- `GET /by-period` - Ganancias por período
- `GET /by-seller` - Ganancias por vendedor
- `GET /{sale_id}` - Ganancia de venta específica

### Vendedores (`/api/v1/sellers`)
- `POST /` - Crear vendedor
- `GET /` - Listar vendedores
- `GET /{seller_id}` - Obtener vendedor
- `PUT /{seller_id}` - Actualizar vendedor
- `DELETE /{seller_id}` - Eliminar vendedor
- `GET /{seller_id}/sales` - Ventas del vendedor

## 🗃️ Base de Datos

### Crear una nueva migración
```bash
alembic revision --autogenerate -m "descripción del cambio"
```

### Aplicar migraciones
```bash
alembic upgrade head
```

### Revertir última migración
```bash
alembic downgrade -1
```

### Ver historial de migraciones
```bash
alembic history
```

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt
- Tokens JWT con expiración configurable
- Validación de roles (admin/user)
- CORS configurado
- Blacklist de tokens (en memoria, usar Redis en producción)

## 📝 Notas de Desarrollo

### Cambiar contraseñas por defecto
Las contraseñas de los seeders (`Admin123`, `Usuario123`) son solo para desarrollo. Cámbialas en producción.

### Blacklist de tokens
Actualmente usa una blacklist en memoria. Para producción, implementar con Redis para persistencia entre reinicios.

### Email para recuperación de contraseña
El endpoint `/forgot-password` actualmente retorna el token en la respuesta (solo desarrollo). En producción, debe enviarse por email.

## 🐛 Troubleshooting

### Error de conexión a base de datos
Verifica que PostgreSQL esté corriendo y que las credenciales en `.env` sean correctas.

### Error "relation does not exist"
Ejecuta las migraciones: `alembic upgrade head`

### Error de importación
Asegúrate de estar en el entorno virtual: `source venv/bin/activate`

## 📄 Licencia

Este proyecto es parte de un sistema de punto de venta privado.

## 👥 Contribuidores

- Tu nombre aquí

---

**Última actualización:** 1 de febrero de 2026
