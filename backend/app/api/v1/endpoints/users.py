from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime, timezone
from app.db.database import get_db
from app.models.user import User as UserModel
from app.schemas.user import User, UserCreate, UserUpdate
from app.core.security import get_password_hash
from app.core.dependencies import get_current_active_user, require_admin

router = APIRouter()


@router.get(
    "/me",
    response_model=User,
    summary="Obtener perfil del usuario autenticado",
    description="Obtiene los datos del usuario actualmente autenticado"
)
def read_user_me(current_user: UserModel = Depends(get_current_active_user)):
    """Retorna los datos del usuario autenticado."""
    return current_user


@router.get(
    "/",
    response_model=List[User],
    summary="Listar usuarios",
    description="Obtiene la lista de todos los usuarios. Requiere autenticación."
)
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """Lista todos los usuarios con paginación. Requiere estar autenticado."""
    users = db.query(UserModel).offset(skip).limit(limit).all()
    return users


@router.get(
    "/{user_id}",
    response_model=User,
    summary="Obtener usuario por ID",
    description="Obtiene un usuario específico. Requiere autenticación."
)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """Obtiene un usuario por su ID. Requiere estar autenticado."""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    return user

@router.patch(
    "/{user_id}",
    response_model=User,
    status_code=status.HTTP_200_OK,
    summary="Actualizar usuario",
    description="Actualiza los detalles de un usuario existente. Solo admins pueden cambiar roles."
)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Actualiza un usuario existente:
    
    - **username**: Nombre de usuario único (3-50 caracteres)
    - **email**: Correo electrónico válido y único
    - **password**: Contraseña segura (mínimo 8 caracteres, 1 mayúscula, 1 número)
    - **full_name**: Nombre completo del usuario
    - **role**: Rol del usuario (solo admin puede cambiar)
    - **is_active**: Estado del usuario (solo admin puede cambiar)
    
    Los usuarios pueden actualizar sus propios datos excepto el rol.
    Solo administradores pueden cambiar roles y actualizar otros usuarios.
    """
    # Buscar el usuario a actualizar
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar permisos: admin puede actualizar cualquier usuario, usuario solo puede actualizarse a sí mismo
    require_admin(current_user)
    
    # Verificar email único si se está actualizando
    if user_update.email is not None:
        existing_user = db.query(UserModel).filter(
            UserModel.email == user_update.email,
            UserModel.id != user_id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado por otro usuario"
            )
    
    # Verificar username único si se está actualizando
    if user_update.username is not None:
        existing_user = db.query(UserModel).filter(
            UserModel.username == user_update.username,
            UserModel.id != user_id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está en uso por otro usuario"
            )
    
    try:
        # Actualizar solo los campos que se proporcionaron
        if user_update.username is not None:
            user.username = user_update.username
        
        if user_update.email is not None:
            user.email = user_update.email
        
        if user_update.password is not None:
            user.hashed_password = get_password_hash(user_update.password)
        
        if user_update.full_name is not None:
            user.full_name = user_update.full_name
        
        if user_update.is_active is not None and user_update.is_active != user.is_active:
            user.is_active = user_update.is_active
            
        if user_update.role is not None and user_update.role != user.role:
            user.role = user_update.role
        db.commit()
        db.refresh(user)
        
        return user
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al actualizar el usuario. Verifica que el email y username sean únicos."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al actualizar el usuario"
        )
        
@router.patch(
    "/me/update",
    response_model=User,
    status_code=status.HTTP_200_OK,
    summary="Actualizar perfil propio",
    description="Permite al usuario autenticado actualizar su propio perfil. No puede cambiar rol ni is_active."
)
def update_own_user(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Actualiza el perfil del usuario autenticado:
    
    - **username**: Nombre de usuario único (3-50 caracteres)
    - **email**: Correo electrónico válido y único
    - **password**: Nueva contraseña (mínimo 8 caracteres, 1 mayúscula, 1 número)
    - **full_name**: Nombre completo del usuario
    
    No se puede cambiar: role, is_active (solo admins pueden cambiar estos campos)
    """
    # El usuario a actualizar es el usuario autenticado
    user = db.query(UserModel).filter(UserModel.id == current_user.id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar que no se intente cambiar role o is_active
    if user_update.role is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes cambiar tu propio rol. Contacta a un administrador."
        )
    
    if user_update.is_active is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes cambiar tu propio estado de activación."
        )
    
    # email único si se está actualizando
    if user_update.email is not None:
        existing_user = db.query(UserModel).filter(
            UserModel.email == user_update.email,
            UserModel.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado por otro usuario"
            )
    
    # username único si se está actualizando
    if user_update.username is not None:
        existing_user = db.query(UserModel).filter(
            UserModel.username == user_update.username,
            UserModel.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está en uso por otro usuario"
            )
    
    try:
        # Actualizar solo los campos que se proporcionaron
        if user_update.username is not None:
            user.username = user_update.username
        if user_update.email is not None:
            user.email = user_update.email
        if user_update.password is not None:
            user.hashed_password = get_password_hash(user_update.password)
        if user_update.full_name is not None:
            user.full_name = user_update.full_name
        
        # is_active y role no pueden ser actualizados por el usuario mismo
        db.commit()
        db.refresh(user)
        return user
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al actualizar el usuario. Verifica que el email y username sean únicos."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al actualizar el usuario"
        )
        
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    require_admin(current_user)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    try:
        user.is_active = False
        db.commit()
        return user_id
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al eliminar el usuario"
        )