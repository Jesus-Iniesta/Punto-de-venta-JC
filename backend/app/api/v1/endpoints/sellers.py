from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone
from app.db.database import get_db
from app.models.sellers import Sellers as SellersModel
from app.models.sales import Sales as SalesModel
from app.schemas.sellers import Seller, SellerCreate, SellerUpdate
from app.schemas.sales import Sale
from app.core.dependencies import get_current_active_user, require_admin
from app.models.user import User as UserModel

router = APIRouter()


@router.post(
    "/",
    response_model=Seller,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_current_active_user), Depends(require_admin)]
)
def create_seller(
    seller_in: SellerCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Crear un nuevo vendedor.
    Requiere autenticación y permisos de administrador.
    """
    # Verificar permisos de administrador
    require_admin(current_user)
    
    if requested_seller := db.query(SellersModel).filter(SellersModel.name == seller_in.name).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El vendedor con este nombre ya existe."
        )
    
    new_seller = SellersModel(
        name=seller_in.name,
        contact_info=seller_in.contact_info,
        is_active=True,
        created_at=datetime.now(timezone.utc)
    )
    
    db.add(new_seller)
    
    try:
        db.commit()
        db.refresh(new_seller)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear el vendedor."
        )
    
    return new_seller

@router.get(
    "/",
    response_model=List[Seller]
)
def list_sellers(
    skip: int = 0,
    limit: int = Query(10, le=100),
    db: Session = Depends(get_db)
):
    """
    Listar todos los vendedores con paginación (PÚBLICO - no requiere autenticación).
    """
    sellers = db.query(SellersModel).offset(skip).limit(limit).all()
    return sellers

@router.get(
    "/{seller_id}",
    response_model=Seller,
    dependencies=[Depends(get_current_active_user)]
)
def get_seller(
    seller_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtener detalles de un vendedor por su ID.
    Requiere autenticación.
    """
    seller = db.query(SellersModel).filter(SellersModel.id == seller_id).first()
    
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendedor no encontrado."
        )
    
    return seller

@router.put(
    "/{seller_id}",
    response_model=Seller,
    dependencies=[Depends(get_current_active_user), Depends(require_admin)]
)
def update_seller(
    seller_id: int,
    seller_in: SellerUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Actualizar los detalles de un vendedor.
    Requiere autenticación y permisos de administrador.
    """
    # Verificar permisos de administrador
    require_admin(current_user)
    
    seller = db.query(SellersModel).filter(SellersModel.id == seller_id).first()
    
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendedor no encontrado."
        )
    
    if seller_in.name is not None:
        seller.name = seller_in.name
    if seller_in.contact_info is not None:
        seller.contact_info = seller_in.contact_info
    if seller_in.is_active is not None:
        seller.is_active = seller_in.is_active
    
    try:
        db.commit()
        db.refresh(seller)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar el vendedor."
        )
    
    return seller

@router.delete(
    "/{seller_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(get_current_active_user), Depends(require_admin)]
)
def delete_seller(
    seller_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Eliminar un vendedor por su ID.
    Requiere autenticación y permisos de administrador.
    """
    # Verificar permisos de administrador
    require_admin(current_user)
    
    seller = db.query(SellersModel).filter(SellersModel.id == seller_id).first()
    
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendedor no encontrado."
        )
    
    
    
    try:
        seller.is_active = False  # Desactivar en lugar de eliminar
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar el vendedor."
        )
        
    return {"message": f"Vendedor eliminado correctamente con id {seller_id}."}

@router.get(
    "/{seller_id}/sales",
    response_model=List[Sale],
    dependencies=[Depends(get_current_active_user)]
)
def get_sales_by_seller(
    seller_id: int,
    skip: int = 0,
    limit: int = Query(10, le=100),
    db: Session = Depends(get_db)
):
    """
    Obtener todas las ventas asociadas a un vendedor específico.
    Requiere autenticación.
    """
    sales = db.query(SalesModel).options(
        joinedload(SalesModel.product),
        joinedload(SalesModel.seller)
    ).filter(SalesModel.seller_id == seller_id).offset(skip).limit(limit).all()
    
    return sales