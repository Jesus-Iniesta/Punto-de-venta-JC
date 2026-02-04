# Sistema de Gestión de Productos

## Funcionalidades Implementadas

### Para Usuarios Admin

#### Crear Productos
- **Ruta**: `/admin/products/create`
- **Acceso**: Solo usuarios con rol `admin`

**Formulario incluye:**
- ✅ Nombre del producto (requerido)
- ✅ Descripción (opcional)
- ✅ Precio de costo (requerido)
- ✅ Precio de venta (requerido)
- ✅ Cantidad en inventario
- ✅ Subida de imagen personalizada
- ✅ Estado activo/inactivo

**Flujo de creación:**
1. Admin hace clic en "Subir artículos" en el navbar
2. Rellena el formulario
3. Sube una imagen (opcional)
   - Click en rectángulo gris
   - Selecciona imagen
   - Preview instantáneo
   - Formatos: JPG, PNG, WEBP
   - Tamaño máx: 10MB
4. Guarda el producto
5. Backend calcula automáticamente el margen de ganancia
6. Redirige al Home
7. Producto aparece en la colección

### Visualización en Home

**ProductsSection actualizado:**
- ✅ Consume datos reales del backend (`GET /products`)
- ✅ Muestra solo productos activos
- ✅ Imágenes desde el servidor
- ✅ Estados de carga y error
- ✅ Fallback de imágenes si fallan
- ✅ Diseño responsive mantenido

## Archivos Creados/Modificados

### Nuevos Servicios
- `src/services/productService.js` - Servicios API para productos

### Nuevos Componentes
- `src/pages/CreateProduct.jsx` - Formulario de creación
- `src/styles/pages/CreateProduct.css` - Estilos del formulario

### Componentes Actualizados
- `src/components/ProductsSection.jsx` - Datos reales del backend
- `src/components/ProductCard.jsx` - Imágenes del servidor
- `src/components/Navbar.jsx` - Link funcional a "Subir artículos"
- `src/App.jsx` - Ruta protegida para admin

### Estilos Actualizados
- `src/styles/components/ProductsSection.css` - Estados de carga

## Endpoints Consumidos

### GET /api/v1/products
Obtiene todos los productos (filtrados por activos en frontend)

### POST /api/v1/products
Crea un nuevo producto
```json
{
  "name": "Ramo Rosa",
  "description": "Descripción",
  "price": 350,
  "cost_price": 200,
  "stock": 10,
  "is_active": true
}
```

### POST /api/v1/products/{id}/image
Sube la imagen del producto
- FormData con campo `file`
- Content-Type: multipart/form-data

## Validaciones Implementadas

### Frontend
- Nombre requerido
- Precio > 0
- Costo > 0
- Precio de venta > Precio de costo
- Imagen: JPG, PNG, WEBP (máx 10MB)

### Backend (ya existente)
- Validación de datos
- Cálculo automático de profit_margin
- Nombres únicos de productos
- Validación de tipos de archivo

## Próximos Pasos

- Editar productos existentes
- Eliminar productos
- Panel de administración
- Gestión de inventario
- Sistema de categorías
