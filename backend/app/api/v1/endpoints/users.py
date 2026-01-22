from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from datetime import datetime, timezone
from app.db.database import get_db
from app.models.user import User as UserModel
from app.schemas.user import User, UserCreate
from app.core.security import get_password_hash

router = APIRouter()


@router.post(
    "/register",
    response_model=User,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nuevo usuario",
    description="Crea un nuevo usuario en el sistema con validaciones completas"
)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Registra un nuevo usuario:
    
    - **username**: Nombre de usuario único (3-50 caracteres)
    - **email**: Correo electrónico válido y único
    - **password**: Contraseña segura (mínimo 8 caracteres, 1 mayúscula, 1 número)
    - **full_name**: Nombre completo del usuario
    - **role**: Rol del usuario (user o admin), default: user
    
    Retorna el usuario creado sin exponer la contraseña.
    """
    
    # Verificar si el email ya existe
    existing_user = db.query(UserModel).filter(UserModel.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Verificar si el username ya existe
    existing_user = db.query(UserModel).filter(UserModel.username == user.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya está en uso"
        )
    
    try:
        # Hash de la contraseña usando bcrypt
        hashed_password = get_password_hash(user.password)
        
        # Crear el nuevo usuario
        db_user = UserModel(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password,
            full_name=user.full_name,
            is_active=user.is_active,
            role=user.role,
            created_at=datetime.now(timezone.utc)
        )
        
        # Guardar en la base de datos
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user
        
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al crear el usuario. Verifica que el email y username sean únicos."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al crear el usuario"
        )


@router.get("/", response_model=List[User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(UserModel).offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user
