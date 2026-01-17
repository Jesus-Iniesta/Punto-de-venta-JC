# Punto de Venta - Sistema Completo

Sistema de punto de venta con backend FastAPI y frontend React, completamente dockerizado.

## Estructura del Proyecto

```
PuntoVenta/
├── backend/                # Backend FastAPI
│   ├── app/
│   │   ├── api/           # Endpoints de la API
│   │   ├── core/          # Configuración y seguridad
│   │   ├── db/            # Configuración de base de datos
│   │   ├── models/        # Modelos SQLAlchemy
│   │   └── schemas/       # Schemas Pydantic
│   ├── Dockerfile
│   ├── requirements.txt
│   └── main.py
├── frontend/               # Frontend React + Vite
│   ├── src/
│   │   ├── services/      # Servicios API
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   └── package.json
├── docker-compose.yml      # Para desarrollo
└── docker-compose.prod.yml # Para producción
```

## Requisitos Previos

- Docker
- Docker Compose
- pnpm (para desarrollo local sin Docker)

## Configuración Inicial

### 1. Configurar Variables de Entorno

**Backend:**
```bash
cp backend/.env.example backend/.env
# Editar backend/.env con tus configuraciones
```

**Frontend:**
```bash
cp frontend/.env.example frontend/.env
# Editar frontend/.env con tus configuraciones
```

**Producción:**
```bash
# Crear .env en la raíz para docker-compose.prod.yml
cat > .env << EOF
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password_seguro
POSTGRES_DB=punto_venta
SECRET_KEY=tu_secret_key_muy_seguro_aqui
ACCESS_TOKEN_EXPIRE_MINUTES=30
EOF
```

## Ejecución con Docker

### Desarrollo

```bash
# Construir y levantar todos los servicios
docker-compose up --build

# O en segundo plano
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

Acceder a:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432

### Producción

```bash
# Construir y levantar en modo producción
docker-compose -f docker-compose.prod.yml up -d --build

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Detener servicios
docker-compose -f docker-compose.prod.yml down
```

Acceder a:
- Aplicación: http://localhost (puerto 80)
- Backend API: http://localhost/api

## Desarrollo Local (Sin Docker)

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Asegurarse de tener PostgreSQL corriendo y configurado en .env

# Ejecutar servidor
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend

# Instalar dependencias
pnpm install

# Ejecutar servidor de desarrollo
pnpm dev
```

## Endpoints de la API

### Autenticación
- `POST /api/v1/auth/login` - Login de usuario

### Usuarios
- `GET /api/v1/users/` - Listar usuarios
- `POST /api/v1/users/` - Crear usuario
- `GET /api/v1/users/{id}` - Obtener usuario

### Productos
- `GET /api/v1/products/` - Listar productos
- `POST /api/v1/products/` - Crear producto
- `GET /api/v1/products/{id}` - Obtener producto
- `PUT /api/v1/products/{id}` - Actualizar producto
- `DELETE /api/v1/products/{id}` - Eliminar producto

## Comandos Útiles de Docker

```bash
# Ver contenedores corriendo
docker ps

# Acceder a la shell del backend
docker exec -it punto_venta_backend sh

# Acceder a PostgreSQL
docker exec -it punto_venta_db psql -U postgres -d punto_venta

# Ver logs de un servicio específico
docker-compose logs -f backend

# Reconstruir un servicio específico
docker-compose up -d --build backend

# Limpiar volúmenes (¡Cuidado! Borra datos)
docker-compose down -v
```

## Base de Datos

Las tablas se crean automáticamente al iniciar el backend gracias a SQLAlchemy.

Modelos incluidos:
- **Users**: Usuarios del sistema
- **Products**: Productos del punto de venta

Para agregar más modelos:
1. Crear archivo en `backend/app/models/`
2. Importar en `backend/app/models/__init__.py`
3. Crear schemas en `backend/app/schemas/`
4. Crear endpoints en `backend/app/api/v1/endpoints/`

## Tecnologías Utilizadas

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- Pydantic
- JWT para autenticación

### Frontend
- React 19
- Vite 7
- pnpm

### DevOps
- Docker
- Docker Compose
- Nginx (producción)

## Notas de Seguridad

⚠️ **Importante para producción:**

1. Cambiar `SECRET_KEY` en las variables de entorno
2. Usar contraseñas fuertes para PostgreSQL
3. Configurar CORS apropiadamente
4. Usar HTTPS con certificados SSL
5. Implementar rate limiting
6. Revisar permisos de usuario en la base de datos

## Extensión del Template

Este template está listo para extender con:
- Más modelos (ventas, clientes, inventario, etc.)
- Autenticación avanzada (roles, permisos)
- WebSockets para actualizaciones en tiempo real
- Sistema de reportes
- Integración con sistemas de pago
- Y mucho más...

## Troubleshooting

**El backend no se conecta a la base de datos:**
- Verificar que PostgreSQL esté corriendo
- Revisar variables de entorno en `.env`
- Esperar a que el healthcheck de PostgreSQL pase

**El frontend no se conecta al backend:**
- Verificar `VITE_API_URL` en `.env` del frontend
- Revisar configuración de CORS en el backend

**Puerto ya en uso:**
- Cambiar puertos en `docker-compose.yml`
- O detener el servicio que está usando el puerto

## Licencia

Este es un template base para desarrollo. Úsalo libremente en tus proyectos.
