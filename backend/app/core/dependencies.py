from fastapi import Depends, HTTPException, status, Cookie
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import Optional
from app.core.config import settings
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import TokenData
from app.models.sales import Sales
from app.schemas.sales import SaleStatus
from app.core.session import session_store

# OAuth2 scheme para extraer el token del header Authorization
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency para obtener el usuario actual desde el JWT token.
    Valida el token y retorna el usuario de la base de datos.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decodificar el token JWT
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        username: str = payload.get("sub")
        
        if username is None:
            raise credentials_exception
        
        token_data = TokenData(username=username)
        
    except JWTError:
        raise credentials_exception
    
    # Buscar el usuario en la base de datos
    user = db.query(User).filter(User.username == token_data.username).first()
    
    if user is None:
        raise credentials_exception
    
    return user


def get_current_user_from_session(
    session_id: Optional[str] = Cookie(None, alias="session_id"),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency para obtener el usuario actual desde la sesión Redis (cookie).
    Prioriza sesión sobre JWT.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales de sesión",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not session_id:
        raise credentials_exception
    
    # Obtener datos de sesión desde Redis
    session_data = session_store.get_session(session_id)
    
    if not session_data:
        raise credentials_exception
    
    # Refrescar TTL de la sesión
    session_store.refresh_session(session_id)
    
    # Buscar usuario en la base de datos
    user = db.query(User).filter(User.id == session_data["user_id"]).first()
    
    if user is None:
        raise credentials_exception
    
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency para obtener el usuario actual y verificar que esté activo.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )
    return current_user


def get_current_active_user_with_session(
    current_user: User = Depends(get_current_user_from_session)
) -> User:
    """
    Dependency para obtener el usuario actual desde sesión y verificar que esté activo.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )
    return current_user


def require_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Dependency para verificar que el usuario actual sea administrador.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de administrador para realizar esta acción"
        )
    return current_user

def validate_pending_sale_in_product(
    product_id: int,
    db: Session = Depends(get_db)
) -> Sales:
    """
    Dependency para validar que una venta esté en estado PENDING o PARTIAL 
    para no poder eliminar un producto asociado.
    """
    product_sales = db.query(Sales).filter(
        Sales.product_id == product_id,
        Sales.status.in_([SaleStatus.PENDING, SaleStatus.PARTIAL])
    ).first()
    if product_sales:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar el producto porque tiene ventas pendientes o parciales asociadas"
        )
    return product_sales