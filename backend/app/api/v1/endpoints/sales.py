from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.database import get_db
from app.models.sales import Sales as SalesModel
from app.models.product import Product as ProductModel
from app.schemas.sales import Sale, SaleCreate, SaleUpdate, SalePayment, SaleStatusUpdate, SaleStatus
from app.core.dependencies import get_current_active_user, require_admin
from app.models.user import User as UserModel

router = APIRouter()

@router.post("/",
             response_model=Sale,
             status_code=status.HTTP_201_CREATED,
             summary="Crear una nueva venta",
             description="Crear una nueva venta en el sistema.")
def create_sale(
    sale: SaleCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    # Verificar permisos del usuario
    require_admin(current_user)
    
    # Verificar que el producto exista
    product = db.query(ProductModel).filter(ProductModel.id == sale.product_id).first()
    if not product:
        raise HTTPException(status_code=404,
                            detail="Producto no encontrado")
    
    # Verificar que haya suficiente stock
    if product.stock < sale.quantity:
        raise HTTPException(status_code=400,
                            detail="Stock insuficiente para la venta")
    
    try:
        # Calcular subtotal, total_price, amount_remaining
        subtotal = product.price * sale.quantity
        total_price = subtotal - (sale.subtotal * sale.discount / 100)
        amount_remaining = total_price - sale.amount_paid
        
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
            status=SaleStatus.PENDING if amount_remaining > 0 else SaleStatus.COMPLETED
        )
        
        # Actualizar stock del producto
        if SaleStatus(new_sale.status) in [SaleStatus.COMPLETED, SaleStatus.PARTIAL]:
            product.stock -= sale.quantity
        
        db.add(new_sale)
        db.commit()
        db.refresh(new_sale)
        
        return new_sale
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error al crear la venta")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/",
            response_model=list[Sale],
            summary="Listar ventas",
            description="Obtener una lista de todas las ventas registradas en el sistema con paginación.")
def read_sales(
    skip: int = Query(0, ge=0, description="Número de registros a omitir para paginación"),
    limit: int = Query(10, ge=1, le=100, description="Número máximo de registros a retornar"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    # Verificar permisos del usuario
    require_admin(current_user)
    
    sales = db.query(SalesModel).offset(skip).limit(limit).all()
    return sales