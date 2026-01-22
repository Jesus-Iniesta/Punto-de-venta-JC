from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime, timezone
from app.db.database import get_db
from app.models.product import Product as ProductModel
from app.schemas.product import Product, ProductCreate, ProductUpdate
from app.core.dependencies import get_current_active_user, require_admin
from app.models.user import User as UserModel

router = APIRouter()


@router.post(
    "/",
    response_model=Product,
    status_code=status.HTTP_201_CREATED,
    summary="Crear producto",
    description="Crea un nuevo producto en el sistema. Calcula automáticamente el precio de venta si no se proporciona."
)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Crea un nuevo producto:
    
    - **name**: Nombre único del producto
    - **description**: Descripción opcional
    - **cost_price**: Precio de costo/inversión (requerido)
    - **price**: Precio de venta (opcional, se calcula automáticamente)
    - **profit_margin**: Margen de ganancia en % (opcional, usado para calcular precio)
    - **stock**: Cantidad inicial en inventario (default: 0)
    - **image_url**: URL de la imagen del producto (opcional)
    
    **Cálculo automático de precio:**
    - Si proporcionas `profit_margin`, el precio se calcula: `cost_price * (1 + profit_margin/100)`
    - Si proporcionas `price`, se calcula el `profit_margin` automáticamente
    - Si proporcionas ambos, se valida que sean consistentes
    
    **Ejemplo 1:** cost_price=100, profit_margin=30 → price=130
    **Ejemplo 2:** cost_price=100, price=150 → profit_margin=50%
    """
    #Verificar permisos del usuario para crear productos
    require_admin(current_user)
    
    # Verificar que el nombre no exista
    existing_product = db.query(ProductModel).filter(
        ProductModel.name == product.name
    ).first()
    
    if existing_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un producto con el nombre '{product.name}'"
        )
    
    try:
        # Calcular precio y margen de ganancia
        calculated_price = product.price
        calculated_profit_margin = product.profit_margin
        
        # Caso 1: Solo se proporciona margen de ganancia
        if product.profit_margin is not None and product.price is None:
            calculated_price = product.cost_price * (1 + product.profit_margin / 100)
            calculated_profit_margin = product.profit_margin
        
        # Caso 2: Solo se proporciona precio
        elif product.price is not None and product.profit_margin is None:
            calculated_price = product.price
            calculated_profit_margin = ((product.price - product.cost_price) / product.cost_price) * 100
        
        # Caso 3: Se proporcionan ambos (validar consistencia)
        elif product.price is not None and product.profit_margin is not None:
            expected_price = product.cost_price * (1 + product.profit_margin / 100)
            # Permitir pequeña diferencia por redondeo (0.01)
            if abs(product.price - expected_price) > 0.01:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El precio {product.price} no es consistente con el margen {product.profit_margin}%. "
                           f"Precio esperado: {expected_price:.2f}"
                )
            calculated_price = product.price
            calculated_profit_margin = product.profit_margin
        
        # Caso 4: No se proporciona ninguno (error)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debes proporcionar al menos 'price' o 'profit_margin'"
            )
        
        # Validar que el precio sea mayor al costo
        if calculated_price <= product.cost_price:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El precio de venta ({calculated_price:.2f}) debe ser mayor al precio de costo ({product.cost_price})"
            )
        
        # Crear el producto
        db_product = ProductModel(
            name=product.name,
            description=product.description,
            cost_price=product.cost_price,
            price=calculated_price,
            profit_margin=calculated_profit_margin,
            stock=product.stock,
            image_url=product.image_url,
            is_active=product.is_active,
            created_at=datetime.now(timezone.utc)
        )
        
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        
        return db_product
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al crear el producto. Verifica que el nombre sea único."
        )
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor al crear el producto: {str(e)}"
        )


@router.get("/", response_model=List[Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db),
                  current_user: UserModel = Depends(get_current_active_user)):
    """
    Obtiene una lista de productos con paginación.
    - **skip**: Número de productos a omitir (default: 0)
    - **limit**: Número máximo de productos a retornar (default: 100)
    """
    products = db.query(ProductModel).offset(skip).limit(limit).all()
    return products


@router.get("/{product_id}", response_model=Product)
def read_product(product_id: int, db: Session = Depends(get_db),
                 current_user: UserModel = Depends(get_current_active_user)):
    """
    Obtiene un producto por su ID.
    - **product_id**: ID del producto a obtener
    """
    product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product


@router.put(
    "/{product_id}",
    response_model=Product,
    status_code=status.HTTP_200_OK,
    summary="Actualizar producto",
    description="Actualiza un producto existente. Recalcula automáticamente precio o margen de ganancia según los cambios."
)
def update_product(
    product_id: int,
    product: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Actualiza un producto existente:
    
    - **name**: Nombre único del producto
    - **cost_price**: Precio de costo/inversión
    - **price**: Precio de venta
    - **profit_margin**: Margen de ganancia en %
    - **stock**: Cantidad en inventario
    - **is_active**: Si el producto está activo
    
    **Recálculo automático:**
    - Si cambias `cost_price` y `price`, recalcula `profit_margin`
    - Si cambias `cost_price` y `profit_margin`, recalcula `price`
    - Si cambias `price` y no `cost_price`, recalcula `profit_margin`
    - Valida que precio > costo siempre
    
    Solo administradores pueden actualizar productos.
    """
    # Verificar permisos de admin
    require_admin(current_user)
    
    # Buscar el producto
    db_product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if db_product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con ID {product_id} no encontrado"
        )
    
    # Verificar nombre único si cambia
    if product.name is not None and product.name != db_product.name:
        existing_product = db.query(ProductModel).filter(
            ProductModel.name == product.name,
            ProductModel.id != product_id
        ).first()
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe otro producto con el nombre '{product.name}'"
            )
    # Verificar precio si cambia o costo
    if (product.price is not None or product.cost_price is not None):
        if product.price <= product.cost_price:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El precio de venta ({product.price}) debe ser mayor al precio de costo ({product.cost_price})"
            )
        if (product.cost_price < 0 or product.price < 0):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El precio y el costo no pueden ser negativos"
            )
    
    try:
        # Obtener valores actuales o nuevos
        current_cost = product.cost_price if product.cost_price is not None else db_product.cost_price
        current_price = product.price if product.price is not None else db_product.price
        current_margin = product.profit_margin if product.profit_margin is not None else db_product.profit_margin
        
        # Recalcular precio/margen según lo que cambió
        needs_recalculation = (
            product.cost_price is not None or 
            product.price is not None or 
            product.profit_margin is not None
        )
        
        if needs_recalculation:
            # Caso 1: Cambió cost_price y profit_margin → recalcular price
            if product.cost_price is not None and product.profit_margin is not None and product.price is None:
                current_price = current_cost * (1 + current_margin / 100)
            
            # Caso 2: Cambió cost_price y price → recalcular profit_margin
            elif product.cost_price is not None and product.price is not None and product.profit_margin is None:
                current_margin = ((current_price - current_cost) / current_cost) * 100
            
            # Caso 3: Solo cambió price → recalcular profit_margin
            elif product.price is not None and product.cost_price is None and product.profit_margin is None:
                current_margin = ((current_price - current_cost) / current_cost) * 100
            
            # Caso 4: Solo cambió cost_price → recalcular price manteniendo margen
            elif product.cost_price is not None and product.price is None and product.profit_margin is None:
                current_price = current_cost * (1 + current_margin / 100)
            
            # Caso 5: Solo cambió profit_margin → recalcular price
            elif product.profit_margin is not None and product.cost_price is None and product.price is None:
                current_price = current_cost * (1 + current_margin / 100)
            
            # Validar que el precio sea mayor al costo
            if current_price <= current_cost:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El precio de venta ({current_price:.2f}) debe ser mayor al precio de costo ({current_cost})"
                )
        
        # Actualizar campos
        if product.name is not None:
            db_product.name = product.name
        
        if product.description is not None:
            db_product.description = product.description
        
        if needs_recalculation:
            db_product.cost_price = current_cost
            db_product.price = current_price
            db_product.profit_margin = current_margin
        
        if product.stock is not None:
            db_product.stock = product.stock
        
        if product.image_url is not None:
            db_product.image_url = product.image_url
        
        if product.is_active is not None:
            db_product.is_active = product.is_active
        
        db.commit()
        db.refresh(db_product)
        
        return db_product
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al actualizar el producto. Verifica que el nombre sea único."
        )
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor al actualizar el producto: {str(e)}"
        )


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db),
                   current_user: UserModel = Depends(get_current_active_user)):
    db_product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Verificar permisos de admin
    require_admin(current_user)
    try:
        db_product.is_active = False  # Desactivar en lugar de eliminar
        db.commit()
        return {"detail": f"Producto con ID {product_id} eliminado exitosamente"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor al eliminar el producto: {str(e)}"
        )

@router.patch("/{product_id}/stock",
              response_model=Product,
              status_code=status.HTTP_202_ACCEPTED,
              summary="Actualizar stock del producto",
              description="Actualiza la cantidad en inventario (stock) de un producto específico.")
def update_product_stock(
    product_id: int,
    stock: int = Query(..., ge=0, description="Nueva cantidad en inventario (stock)"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Actualiza el stock de un producto específico.
    
    - **product_id**: ID del producto a actualizar
    - **stock**: Nueva cantidad en inventario (debe ser >= 0)
    """
    # Verificar permisos de admin
    require_admin(current_user)
    
    # Buscar el producto
    db_product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if db_product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con ID {product_id} no encontrado"
        )
    
    try:
        db_product.stock = stock
        db.commit()
        db.refresh(db_product)
        return db_product
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor al actualizar el stock del producto: {str(e)}"
        )