from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone
from app.db.database import get_db
from app.models.sales import Sales as SalesModel
from app.models.product import Product as ProductModel
from app.models.sellers import Sellers as SellersModel
from app.schemas.sales import (
    Sale, SaleCreate, SaleUpdate, SalePayment, 
    SaleStatusUpdate, SaleStatus, SaleWithDetails,
    ProductInfo, SellerInfo
)
from app.core.dependencies import get_current_active_user, require_admin
from app.models.user import User as UserModel

router = APIRouter()


def _determine_sale_status(amount_paid: float, total_price: float) -> SaleStatus:
    """
    Determina el estado de una venta basado en los montos pagados.
    
    - amount_remaining == 0 → COMPLETED
    - amount_remaining > 0 y amount_paid > 0 → PARTIAL  
    - amount_remaining == total_price → PENDING
    """
    amount_remaining = total_price - amount_paid
    
    # Evitar problemas de redondeo
    if abs(amount_remaining) < 0.01:
        return SaleStatus.COMPLETED
    
    if amount_remaining == 0:
        return SaleStatus.COMPLETED
    elif amount_paid > 0:
        return SaleStatus.PARTIAL
    else:
        return SaleStatus.PENDING


@router.post("/",
             response_model=Sale,
             status_code=status.HTTP_201_CREATED,
             summary="Crear una nueva venta",
             description="Registra una nueva venta. Calcula automáticamente el total, actualiza el stock y determina el estado según el pago.")
def create_sale(
    sale: SaleCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Crea una nueva venta con las siguientes validaciones:
    
    - **product_id**: El producto debe existir y estar activo
    - **seller_id**: El vendedor debe existir y estar activo
    - **quantity**: Debe haber stock suficiente
    - **amount_paid**: Monto pagado inicialmente (default: 0)
    - **discount**: Descuento en porcentaje (0-100)
    - **payment_method**: CASH, CARD, TRANSFER, MIXED
    
    **Cálculo automático:**
    - subtotal = product.price * quantity
    - total_price = subtotal - (subtotal * discount / 100)
    - amount_remaining = total_price - amount_paid
    - status = COMPLETED si amount_remaining = 0, PARTIAL si 0 < amount_remaining < total_price, PENDING si amount_remaining = total_price
    
    **Stock:** Se reduce automáticamente al crear la venta
    """
    # Verificar que el producto exista y esté activo
    product = db.query(ProductModel).filter(
        ProductModel.id == sale.product_id,
        ProductModel.is_active == True
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con ID {sale.product_id} no encontrado o está inactivo"
        )
    
    # Verificar que el vendedor exista y esté activo
    seller = db.query(SellersModel).filter(
        SellersModel.id == sale.seller_id,
        SellersModel.is_active == True
    ).first()
    
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vendedor con ID {sale.seller_id} no encontrado o está inactivo"
        )
    
    # Verificar que haya suficiente stock
    if product.stock < sale.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stock insuficiente. Disponible: {product.stock}, solicitado: {sale.quantity}"
        )
    
    # Validar descuento
    if sale.discount < 0 or sale.discount > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El descuento debe estar entre 0 y 100"
        )
    
    try:
        # Calcular subtotal (precio * cantidad)
        subtotal = product.price * sale.quantity
        
        # Calcular total después de aplicar descuento
        discount_amount = subtotal * (sale.discount / 100)
        total_price = subtotal - discount_amount
        
        # Calcular monto restante
        amount_remaining = total_price - sale.amount_paid
        
        # Validar que el monto pagado no sea mayor al total
        if sale.amount_paid > total_price:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El monto pagado ({sale.amount_paid}) no puede ser mayor al total ({total_price:.2f})"
            )
        
        # Determinar el estado de la venta automáticamente
        status_value = _determine_sale_status(sale.amount_paid, total_price)
        
        # Crear la venta
        new_sale = SalesModel(
            product_id=sale.product_id,
            seller_id=sale.seller_id,
            quantity=sale.quantity,
            subtotal=subtotal,
            discount=sale.discount,
            total_price=total_price,
            amount_paid=sale.amount_paid,
            amount_remaining=amount_remaining,
            payment_method=sale.payment_method,
            notes=sale.notes,
            due_date=sale.due_date,
            status=status_value.value,
            created_at=datetime.now(timezone.utc)
        )
        
        # Actualizar stock del producto
        product.stock -= sale.quantity
        
        db.add(new_sale)
        db.commit()
        db.refresh(new_sale)
        
        return new_sale
        
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error de integridad al crear la venta: {str(e)}"
        )
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor al crear la venta: {str(e)}"
        )
    
@router.get("/",
            response_model=list[Sale],
            summary="Listar ventas",
            description="Obtener una lista de todas las ventas con filtros, paginación y totales.")
def read_sales(
    skip: int = Query(0, ge=0, description="Número de registros a omitir para paginación"),
    limit: int = Query(10, ge=1, le=100, description="Número máximo de registros a retornar"),
    status: Optional[SaleStatus] = Query(None, description="Filtrar por estado de venta"),
    seller_id: Optional[int] = Query(None, description="Filtrar por ID de vendedor"),
    start_date: Optional[datetime] = Query(None, description="Fecha inicial para filtrar (formato: YYYY-MM-DD)"),
    end_date: Optional[datetime] = Query(None, description="Fecha final para filtrar (formato: YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Lista todas las ventas con filtros opcionales:
    
    - **status**: Filtrar por PENDING, PARTIAL, COMPLETED, CANCELLED
    - **seller_id**: Filtrar por vendedor específico
    - **start_date**: Fecha de inicio para el rango
    - **end_date**: Fecha de fin para el rango
    - **skip/limit**: Paginación
    
    Solo usuarios autenticados pueden acceder.
    """
    # Construir query base
    query = db.query(SalesModel)
    
    # Aplicar filtros
    if status:
        query = query.filter(SalesModel.status == status.value)
    
    if seller_id:
        query = query.filter(SalesModel.seller_id == seller_id)
    
    if start_date:
        query = query.filter(SalesModel.created_at >= start_date)
    
    if end_date:
        query = query.filter(SalesModel.created_at <= end_date)
    
    # Aplicar paginación
    sales = query.offset(skip).limit(limit).all()
    
    return sales

@router.get("/{sale_id}",
            response_model=SaleWithDetails,
            summary="Obtener detalles completos de una venta",
            description="Obtiene información detallada de una venta específica, incluyendo datos del producto, vendedor y cálculos de ganancia.")
def read_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Obtiene una venta con todos sus detalles:
    
    - **Información de la venta**: cantidad, precios, descuentos, pagos, estado
    - **Detalles del producto**: nombre, costo, precio, imagen
    - **Información del vendedor**: nombre, contacto
    - **Cálculos de ganancia**: profit (ganancia bruta) y porcentaje de margen
    - **Historial de pagos**: amount_paid, amount_remaining
    
    Solo usuarios autenticados pueden acceder a esta información.
    """
    # Cargar venta con relaciones (eager loading)
    sale = db.query(SalesModel).options(
        joinedload(SalesModel.product),
        joinedload(SalesModel.seller)
    ).filter(SalesModel.id == sale_id).first()
    
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Venta con ID {sale_id} no encontrada"
        )
    
    # Calcular ganancia de la venta
    # Ganancia = (precio_venta - costo) * cantidad
    profit_per_unit = sale.product.price - sale.product.cost_price
    total_profit = profit_per_unit * sale.quantity
    
    # Calcular porcentaje de ganancia
    profit_margin_percentage = (profit_per_unit / sale.product.price) * 100 if sale.product.price > 0 else 0
    
    # Construir información del producto
    product_info = ProductInfo(
        id=sale.product.id,
        name=sale.product.name,
        description=sale.product.description,
        cost_price=sale.product.cost_price,
        price=sale.product.price,
        image_url=sale.product.image_url
    )
    
    # Construir información del vendedor
    seller_info = SellerInfo(
        id=sale.seller.id,
        name=sale.seller.name,
        contact_info=sale.seller.contact_info
    )
    
    # Construir respuesta con todos los detalles
    sale_dict = {
        "id": sale.id,
        "product_id": sale.product_id,
        "seller_id": sale.seller_id,
        "quantity": sale.quantity,
        "status": sale.status,
        "subtotal": sale.subtotal,
        "discount": sale.discount,
        "total_price": sale.total_price,
        "amount_paid": sale.amount_paid,
        "amount_remaining": sale.amount_remaining,
        "payment_method": sale.payment_method,
        "notes": sale.notes,
        "due_date": sale.due_date,
        "created_at": sale.created_at,
        "product": product_info,
        "seller": seller_info,
        "profit": total_profit,
        "profit_margin_percentage": profit_margin_percentage
    }
    
    return sale_dict 

@router.put("/{sale_id}",
            response_model=SaleUpdate,
            summary="Actualizar una venta",
            description="Actualiza los detalles de una venta existente. Solo los campos proporcionados serán modificados.")
def update_sale(
    sale_id: int,
    sale_update: SaleUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    # Verificar permisos del usuario 
    require_admin(current_user)
    # Verificar que la venta exista
    sale = db.query(SalesModel).filter(SalesModel.id == sale_id).first()
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Venta con ID {sale_id} no encontrada"
        )
    # Solo actualiar si el estado es PENDING o PARTIAL
    if sale.status not in [SaleStatus.PENDING.value, SaleStatus.PARTIAL.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden actualizar ventas en estado PENDING o PARTIAL"
        )
    #No permitir actualizar producto si ya hay pagos realizados
    if sale_update.product_id is not None and sale.amount_paid > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede cambiar el producto de una venta que ya tiene pagos realizados"
        )
    # Actualizar campos proporcionados
    try:
        for field, value in sale_update.model_dump(exclude_unset=True).items():
            setattr(sale, field, value)
        db.commit()
        db.refresh(sale)
        return sale
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar la venta: {str(e)}"
        )
        
@router.patch("/{sale_id}/status",
              response_model=SaleStatusUpdate,
                summary="Cambiar el estado de una venta",
                description="Actualiza el estado de una venta. Si se cancela, restaura el stock automáticamente.")
def update_sale_status(
    sale_id: int,
    status_update: SaleStatusUpdate,
    reason: Optional[str] = Query(None, description="Motivo del cambio de estado"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Cambia el estado de una venta con las siguientes validaciones:
    
    - **CANCELLED**: Solo si no hay pagos. Restaura el stock automáticamente
    - **COMPLETED**: Marca la venta como completada
    - **PARTIAL/PENDING**: Cambia el estado según corresponda
    
    Si se cancela, registra el motivo en las notas.
    """
    # Verificar permisos del usuario 
    require_admin(current_user)
    
    # Cargar venta con producto para restaurar stock si se cancela
    sale = db.query(SalesModel).options(
        joinedload(SalesModel.product)
    ).filter(SalesModel.id == sale_id).first()
    
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Venta con ID {sale_id} no encontrada"
        )
    
    # Validar cancelación: solo si no hay pagos
    if status_update.status == SaleStatus.CANCELLED:
        if sale.amount_paid > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede cancelar una venta con pagos realizados. Monto pagado: {sale.amount_paid}"
            )
        
        # Restaurar stock
        sale.product.stock += sale.quantity
        
        # Registrar motivo de cancelación
        cancellation_note = f"[CANCELADA por {current_user.username} el {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}]"
        if reason:
            cancellation_note += f" Motivo: {reason}"
        
        if sale.notes:
            sale.notes += f"\n{cancellation_note}"
        else:
            sale.notes = cancellation_note
    
    # Actualizar estado
    try:
        sale.status = status_update.status.value
        db.commit()
        db.refresh(sale)
        return status_update
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar el estado de la venta: {str(e)}"
        )
        
@router.patch("/{sale_id}/payment",
              response_model=SalePayment,
                summary="Registrar un pago en una venta",
                description="Registra un pago adicional, actualiza el monto pagado y cambia el estado automáticamente.")
def register_sale_payment(
    sale_id: int,
    payment: SalePayment,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Registra un pago en una venta:
    
    - **Validaciones**: El pago no debe exceder el monto restante
    - **Actualiza amount_paid**: Suma el pago al total pagado
    - **Recalcula amount_remaining**: Resta el pago del restante
    - **Cambia estado automáticamente**:
      - amount_remaining == 0 → COMPLETED
      - amount_remaining > 0 y amount_paid > 0 → PARTIAL
    - **TODO**: Crear registro en Earnings cuando se complete
    """
    # Verificar permisos
    require_admin(current_user)
    
    # Verificar que la venta exista
    sale = db.query(SalesModel).filter(SalesModel.id == sale_id).first()
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Venta con ID {sale_id} no encontrada"
        )
    
    # Validar que la venta no esté cancelada o completada
    if sale.status == SaleStatus.CANCELLED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede registrar un pago en una venta cancelada"
        )
    
    if sale.status == SaleStatus.COMPLETED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La venta ya está completada. No se pueden registrar más pagos"
        )
    
    # Validar que el pago no exceda el monto restante
    if payment.amount > sale.amount_remaining:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El pago ({payment.amount}) excede el monto restante ({sale.amount_remaining})"
        )
    
    try:
        # Actualizar montos
        sale.amount_paid += payment.amount
        sale.amount_remaining = sale.total_price - sale.amount_paid
        
        # Evitar valores negativos por redondeo
        if abs(sale.amount_remaining) < 0.01:
            sale.amount_remaining = 0.0
        
        # Determinar el estado automáticamente basado en los montos
        new_status = _determine_sale_status(sale.amount_paid, sale.total_price)
        sale.status = new_status.value
        
        # TODO: Crear registro en Earnings cuando se complete (status == COMPLETED)
        
        # Actualizar método de pago si se proporciona
        if payment.payment_method:
            sale.payment_method = payment.payment_method.value
        
        # Agregar notas del pago
        if payment.notes:
            payment_note = f"[Pago registrado: {payment.amount} el {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}] {payment.notes}"
            if sale.notes:
                sale.notes += f"\n{payment_note}"
            else:
                sale.notes = payment_note
        
        db.commit()
        db.refresh(sale)
        
        return payment
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al registrar el pago: {str(e)}"
        )


@router.delete("/{sale_id}",
               status_code=status.HTTP_200_OK,
               summary="Cancelar una venta",
               description="Cancela una venta y restaura el stock del producto. Solo se pueden cancelar ventas PENDING o sin pagos.")
def delete_sale(
    sale_id: int,
    reason: str = Query(None, description="Motivo de la cancelación"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Cancela una venta utilizando la misma lógica que PATCH /status con CANCELLED.
    
    - **Verificar estado**: Solo se pueden cancelar ventas PENDING o sin pagos
    - **Restaurar stock**: Devuelve la cantidad al inventario del producto
    - **Cambiar estado**: Marca la venta como CANCELLED
    - **Registrar motivo**: Guarda el motivo de cancelación en las notas
    
    Este endpoint es un atajo para cambiar el status a CANCELLED.
    """
    # Crear objeto de actualización de status
    status_update = SaleStatusUpdate(status=SaleStatus.CANCELLED)
    
    # Reutilizar la lógica de update_sale_status
    update_sale_status(
        sale_id=sale_id,
        status_update=status_update,
        reason=reason,
        db=db,
        current_user=current_user
    )
    
    # Obtener la venta actualizada para el mensaje de respuesta
    sale = db.query(SalesModel).filter(SalesModel.id == sale_id).first()
    
    return {
        "message": "Venta cancelada exitosamente",
        "sale_id": sale_id,
        "stock_restored": sale.quantity,
        "reason": reason
    }
