# Seeders - Datos Iniciales

Este directorio contiene scripts para poblar la base de datos con datos iniciales.

## 📋 Qué incluyen los seeders

Los seeders crean automáticamente:

### 👤 Usuarios
- **Admin**: Usuario administrador con todos los permisos
  - Username: `admin`
  - Password: `Admin123`
  - Email: `admin@puntoventa.com`
  
- **Usuario de prueba**: Usuario regular para testing
  - Username: `usuario`
  - Password: `Usuario123`
  - Email: `usuario@puntoventa.com`

### 👨‍💼 Vendedores
- Juan Pérez
- María González
- Carlos Rodríguez

### 📦 Productos de Prueba
- Laptop Dell XPS 15 (10 unidades)
- Mouse Logitech MX Master 3 (25 unidades)
- Teclado Mecánico Keychron K2 (15 unidades)
- Monitor LG 27 4K (8 unidades)
- Audífonos Sony WH-1000XM4 (12 unidades)
- Webcam Logitech C920 (20 unidades)
- SSD Samsung 1TB (30 unidades)
- Router TP-Link AX3000 (18 unidades)

## 🚀 Cómo ejecutar los seeders

### Opción 1: Script directo
```bash
cd backend
python seed.py
```

### Opción 2: Módulo Python
```bash
cd backend
python -m app.db.seeders
```

## ⚠️ Notas importantes

1. **Los seeders son idempotentes**: Puedes ejecutarlos múltiples veces sin crear duplicados. Solo crearán datos que no existan.

2. **Cambiar contraseñas en producción**: Las contraseñas por defecto (`Admin123`, `Usuario123`) son solo para desarrollo. **Cámbialas antes de usar en producción**.

3. **Ejecutar después de las migraciones**: Asegúrate de haber ejecutado todas las migraciones de Alembic antes de correr los seeders:
   ```bash
   alembic upgrade head
   python seed.py
   ```

## 🔧 Personalización

Para agregar más datos de prueba, edita el archivo `app/db/seeders.py`:

- `create_admin_user()` - Usuario administrador
- `create_test_user()` - Usuarios de prueba
- `create_test_sellers()` - Vendedores
- `create_test_products()` - Productos

## 📝 Ejemplo de salida exitosa

```
🌱 Iniciando seeders...

📊 Creando datos de usuarios...
✓ Usuario admin creado: username='admin', password='Admin123'
✓ Usuario de prueba creado: username='usuario', password='Usuario123'

📊 Creando vendedores de prueba...
✓ 3 vendedores de prueba creados

📊 Creando productos de prueba...
✓ 8 productos de prueba creados

✅ Seeders completados exitosamente!

==================================================
CREDENCIALES DE ACCESO:
==================================================
Admin:
  Username: admin
  Password: Admin123

Usuario:
  Username: usuario
  Password: Usuario123
==================================================
```
