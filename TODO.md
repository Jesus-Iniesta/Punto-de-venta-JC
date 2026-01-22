# TODO - Backend Punto de Venta

## 📋 Tareas Pendientes para Completar el Backend

---

## 1. 👤 Módulo de Usuarios (Users)

### Endpoints Faltantes

- [X] **PUT /api/v1/users/{user_id}** - Actualizar usuario
  - Validar que email/username no existan si se cambian
  - Solo admin puede cambiar roles
  - Usuario puede actualizar sus propios datos
  - Hash de password si se actualiza

- [X] **DELETE /api/v1/users/{user_id}** - Eliminar usuario (soft delete)
  - Cambiar `is_active` a False en lugar de eliminar físicamente
  - Solo admin puede eliminar usuarios
  - No permitir auto-eliminación

- [X] **GET /api/v1/users/me** - Obtener usuario autenticado
  - Retornar datos del usuario del token JWT

- [X] **PUT /api/v1/users/me** - Actualizar perfil propio
  - Usuario actualiza sus propios datos (sin cambiar role)

### Mejoras de Seguridad
- [X] Implementar middleware de autenticación JWT
- [X] Implementar dependency para verificar roles (admin/user)
- [ ] Rate limiting para endpoints de autenticación

---

## 2. 🛍️ Módulo de Productos (Products)

### Modelos
- [x] Modelo Product existente
- [ ] Agregar campo `cost_price` (precio de costo/inversión)
- [ ] Agregar campo `profit_margin` (margen de ganancia en %)

### Endpoints Necesarios

- [ ] **POST /api/v1/products/** - Crear producto
  - Validar que el nombre no exista
  - Calcular precio de venta automático si se proporciona costo y margen
  - Subir imagen del producto (opcional)

- [ ] **GET /api/v1/products/** - Listar productos
  - Paginación (skip, limit)
  - Filtros: activos/inactivos, búsqueda por nombre
  - Ordenar por: nombre, precio, stock

- [ ] **GET /api/v1/products/{product_id}** - Obtener producto específico
  - Incluir información de ventas recientes
  - Calcular ganancia potencial

- [ ] **PUT /api/v1/products/{product_id}** - Actualizar producto
  - Validar cambios de precio
  - Registrar historial de cambios de precio (opcional)

- [ ] **DELETE /api/v1/products/{product_id}** - Eliminar producto (soft delete)
  - Cambiar `is_active` a False
  - No permitir eliminar si tiene ventas pendientes

- [ ] **PATCH /api/v1/products/{product_id}/stock** - Actualizar stock
  - Incrementar/decrementar stock manualmente
  - Registrar ajustes de inventario

### Validaciones
- [ ] Stock no puede ser negativo
- [ ] Precio debe ser mayor a costo
- [ ] No permitir vender productos sin stock

---

## 3. 💰 Módulo de Ventas (Sales)

### Actualización del Modelo
Agregar campos al modelo `Sales`:
```python
- status: Enum (PENDING, PARTIAL, COMPLETED, CANCELLED)
- subtotal: Float (precio sin aplicar descuentos)
- discount: Float (descuento aplicado)
- total_price: Float (precio final a pagar)
- amount_paid: Float (cantidad ya pagada)
- amount_remaining: Float (cantidad restante por pagar)
- payment_method: Enum (CASH, CARD, TRANSFER, MIXED)
- notes: Text (notas de la venta)
- due_date: DateTime (fecha límite de pago para pendientes)
```

### Endpoints Necesarios

- [ ] **POST /api/v1/sales/** - Crear nueva venta
  - Validar stock disponible
  - Calcular total automáticamente
  - Permitir descuentos
  - Registrar pago inicial (puede ser 0 para PENDING)
  - Reducir stock si status es COMPLETED o PARTIAL
  - Crear registro en Earnings si está COMPLETED

- [ ] **GET /api/v1/sales/** - Listar ventas
  - Filtros por: status, vendedor, rango de fechas
  - Paginación
  - Totales: ventas completadas, pendientes, parciales

- [ ] **GET /api/v1/sales/{sale_id}** - Obtener venta específica
  - Incluir detalles del producto
  - Historial de pagos
  - Información del vendedor

- [ ] **PUT /api/v1/sales/{sale_id}** - Actualizar venta
  - Solo permitir si status es PENDING o PARTIAL
  - No permitir cambiar productos si ya hay pagos

- [ ] **PATCH /api/v1/sales/{sale_id}/payment** - Registrar pago
  - Agregar monto al `amount_paid`
  - Recalcular `amount_remaining`
  - Cambiar status automáticamente:
    - Si `amount_remaining == 0` → COMPLETED
    - Si `amount_remaining > 0` y `amount_paid > 0` → PARTIAL
  - Crear/actualizar registro en Earnings cuando se complete

- [ ] **PATCH /api/v1/sales/{sale_id}/status** - Cambiar estado
  - PENDING → PARTIAL → COMPLETED
  - Permitir CANCEL solo si no hay pagos o es PENDING
  - Restaurar stock si se cancela

- [ ] **DELETE /api/v1/sales/{sale_id}** - Cancelar venta
  - Solo si status es PENDING
  - Restaurar stock
  - Registrar motivo de cancelación

### Estados de Venta
```
PENDING (Pendiente)
├─ Venta creada pero no hay pago
├─ amount_paid = 0
└─ amount_remaining = total_price

PARTIAL (Parcial)
├─ Hay pagos pero no está completa
├─ 0 < amount_paid < total_price
└─ amount_remaining > 0

COMPLETED (Completada)
├─ Venta pagada completamente
├─ amount_paid = total_price
└─ amount_remaining = 0

CANCELLED (Cancelada)
└─ Venta anulada, stock restaurado
```

### Lógica de Negocio
- [ ] Al crear venta COMPLETED/PARTIAL, reducir stock del producto
- [ ] Al cancelar venta, restaurar stock
- [ ] Notificar cuando una venta PENDING está cerca de `due_date`
- [ ] No permitir eliminar productos con ventas PENDING o PARTIAL

---

## 4. 📊 Módulo de Ganancias (Earnings)

### Actualización del Modelo
Actualizar el modelo `Earnings`:
```python
- sale_id: FK a Sales
- product_id: FK a Products (para tracking por producto)
- cost_price: Float (precio de costo del producto al momento de venta)
- sale_price: Float (precio de venta)
- quantity: Integer (cantidad vendida)
- total_cost: Float (cost_price * quantity)
- total_revenue: Float (sale_price * quantity)
- profit: Float (total_revenue - total_cost)
- profit_margin: Float (% de ganancia)
- is_recorded: Boolean
- created_at: DateTime
```

### Endpoints Necesarios

- [ ] **POST /api/v1/earnings/investment** - Registrar inversión inicial
  - Capital invertido en productos
  - Fecha de inversión
  - Descripción

- [ ] **GET /api/v1/earnings/summary** - Resumen de ganancias
  - Total invertido (suma de cost_price de todos los productos)
  - Total vendido (suma de ventas completadas)
  - Ganancia bruta (total vendido - total invertido)
  - Ganancia neta (después de gastos opcionales)
  - Margen de ganancia promedio
  - Estado: PROFIT (ganancia) o LOSS (pérdida)

- [ ] **GET /api/v1/earnings/by-product** - Ganancias por producto
  - Lista de productos con:
    - Cantidad vendida
    - Total invertido en ese producto
    - Total generado
    - Ganancia/pérdida
    - Margen de ganancia %
  - Ordenar por: más rentables, más vendidos, menos rentables

- [ ] **GET /api/v1/earnings/by-period** - Ganancias por período
  - Filtros: día, semana, mes, año
  - Comparar con período anterior
  - Gráfica de tendencias (retornar datos para frontend)

- [ ] **GET /api/v1/earnings/by-seller** - Ganancias por vendedor
  - Total de ventas por vendedor
  - Comisiones (si aplica)
  - Ranking de vendedores

- [ ] **GET /api/v1/earnings/{sale_id}** - Ganancia de venta específica
  - Desglose completo de costo vs venta

### Cálculos Automáticos
```python
# Al completar una venta:
profit = (sale_price - cost_price) * quantity
profit_margin = ((sale_price - cost_price) / sale_price) * 100

# Estado general:
if total_revenue > total_investment:
    status = "PROFIT"
else:
    status = "LOSS"
```

### Reportes
- [ ] Dashboard de métricas principales
- [ ] Productos más rentables
- [ ] Productos con pérdidas
- [ ] Tendencias de ventas
- [ ] Proyección de ganancias

---

## 5. 👨‍💼 Módulo de Vendedores (Sellers)

### Endpoints Necesarios

- [ ] **POST /api/v1/sellers/** - Crear vendedor
- [ ] **GET /api/v1/sellers/** - Listar vendedores
- [ ] **GET /api/v1/sellers/{seller_id}** - Obtener vendedor
- [ ] **PUT /api/v1/sellers/{seller_id}** - Actualizar vendedor
- [ ] **DELETE /api/v1/sellers/{seller_id}** - Eliminar vendedor (soft delete)
- [ ] **GET /api/v1/sellers/{seller_id}/sales** - Ventas de un vendedor

---

## 6. 🔐 Autenticación y Autorización

### Endpoints de Auth

- [ ] **POST /api/v1/auth/login** - Iniciar sesión
  - Validar credenciales
  - Retornar JWT token
  - Incluir datos del usuario en la respuesta

- [ ] **POST /api/v1/auth/logout** - Cerrar sesión (opcional)
  - Invalidar token (si se usa blacklist)

- [ ] **POST /api/v1/auth/refresh** - Renovar token
  - Generar nuevo token a partir de refresh token

- [ ] **POST /api/v1/auth/forgot-password** - Recuperar contraseña
  - Enviar email con token de recuperación

- [ ] **POST /api/v1/auth/reset-password** - Restablecer contraseña
  - Validar token y cambiar password

### Middleware y Dependencies
- [ ] Dependency `get_current_user` - Extraer usuario del JWT
- [ ] Dependency `require_admin` - Verificar rol de admin
- [ ] Dependency `require_active_user` - Verificar usuario activo

---

## 7. 🗄️ Base de Datos

### Migraciones con Alembic

- [ ] Configurar Alembic correctamente
- [ ] Crear migración inicial con todas las tablas
- [ ] Agregar campos faltantes a modelos existentes:
  - Products: `cost_price`, `profit_margin`
  - Sales: todos los campos del sistema de estados
  - Earnings: campos de cálculo de ganancias

### Seeders
- [ ] Crear usuario admin por defecto
- [ ] Datos de prueba para desarrollo

---

## 8. 📝 Validaciones y Reglas de Negocio

### Productos
- [x] Validación de precio > 0
- [x] Validación de stock >= 0
- [ ] Precio de venta > precio de costo
- [ ] Alerta de stock bajo (configurable)

### Ventas
- [ ] No vender sin stock suficiente
- [ ] No permitir montos negativos en pagos
- [ ] Validar que amount_paid no exceda total_price
- [ ] No modificar ventas completadas

### Usuarios
- [x] Password con requisitos mínimos
- [x] Email único
- [x] Username único
- [ ] No permitir eliminar usuario con ventas asociadas

---

## 9. 🧪 Testing (Opcional pero Recomendado)

- [ ] Tests unitarios para modelos
- [ ] Tests de integración para endpoints
- [ ] Tests de autenticación y autorización
- [ ] Tests de lógica de negocio (cálculos de ganancias)

---

## 10. 📚 Documentación

- [ ] Documentar schemas de Pydantic con descripciones
- [ ] Agregar ejemplos en Swagger UI
- [ ] README con instrucciones de setup
- [ ] Documentar flujo de ventas y estados
- [ ] Diagramas de arquitectura

---

## 🎯 Prioridades

### Alta Prioridad (Funcionalidad Básica)
1. ✅ Registro de usuarios
2. Autenticación (login/logout)
3. CRUD completo de Products
4. CRUD de Sales con estados básicos
5. Cálculo básico de ganancias

### Media Prioridad (Funcionalidad Avanzada)
6. Sistema completo de estados de Sales
7. Earnings con todas las métricas
8. Gestión de Sellers
9. Reportes y analytics

### Baja Prioridad (Mejoras)
10. Sistema de roles avanzado
11. Notificaciones
12. Historial de cambios
13. Backups automáticos

---

## 📊 Estructura de Archivos Sugerida

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── auth.py ✅
│   │       │   ├── users.py (parcial) 🟡
│   │       │   ├── products.py ❌
│   │       │   ├── sales.py ❌
│   │       │   ├── earnings.py ❌
│   │       │   └── sellers.py ❌
│   │       └── api.py ✅
│   ├── core/
│   │   ├── config.py ✅
│   │   ├── security.py ✅
│   │   └── dependencies.py ❌ (crear para JWT)
│   ├── models/
│   │   ├── user.py ✅
│   │   ├── product.py ✅
│   │   ├── sales.py 🟡 (actualizar)
│   │   ├── earnings.py 🟡 (actualizar)
│   │   └── sellers.py ✅
│   ├── schemas/
│   │   ├── user.py ✅
│   │   ├── product.py ✅
│   │   ├── sales.py ❌
│   │   ├── earnings.py ❌
│   │   ├── sellers.py ❌
│   │   └── auth.py ❌
│   └── utils/ (opcional)
│       ├── email.py
│       └── notifications.py
└── alembic/ ❌
    └── versions/
```

**Leyenda:**
- ✅ Completo
- 🟡 Parcial/Necesita actualización
- ❌ Por hacer

---

## 🚀 Próximos Pasos Inmediatos

1. **Crear schemas faltantes** (sales, earnings, sellers)
2. **Implementar autenticación JWT** (login, dependencies)
3. **Completar CRUD de Users** (update, delete)
4. **Implementar CRUD de Products**
5. **Actualizar modelos de Sales y Earnings**
6. **Implementar sistema de ventas con estados**
7. **Implementar cálculos de ganancias**

---

**Última actualización:** 21 de enero de 2026
