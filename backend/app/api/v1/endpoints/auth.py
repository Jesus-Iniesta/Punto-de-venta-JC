from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from typing import Optional
from app.core.config import settings
from app.core.security import (
    create_access_token, 
    create_refresh_token,
    create_password_reset_token,
    verify_password, 
    get_password_hash,
    verify_token,
    invalidate_token
)
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import (
    Token,
    LoginResponse,
    RefreshToken, 
    PasswordResetRequest, 
    PasswordReset,
    UserCreate,
    User as UserSchema
)

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
def login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Iniciar sesión con username y password.
    Retorna access_token JWT y información del usuario.
    """
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Registrar un nuevo usuario.
    Por defecto, el rol es 'user'.
    """
    # Verificar si el username ya existe
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya está registrado"
        )
    
    # Verificar si el email ya existe
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Crear nuevo usuario
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        role="user",  # Por defecto es user
        is_active=True,
        created_at=datetime.now()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generar token para el nuevo usuario
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    authorization: Optional[str] = Header(None)
):
    """
    Cerrar sesión invalidando el token actual.
    El token se agrega a una blacklist (en producción usar Redis).
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no proporcionado"
        )
    
    token = authorization.replace("Bearer ", "")
    invalidate_token(token)
    
    return {"message": "Sesión cerrada correctamente"}


@router.post("/refresh", response_model=Token)
def refresh_token(
    refresh_data: RefreshToken,
    db: Session = Depends(get_db)
):
    """
    Renovar access token usando un refresh token válido.
    """
    username = verify_token(refresh_data.refresh_token, token_type="refresh")
    
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido o expirado"
        )
    
    user = db.query(User).filter(User.username == username).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o inactivo"
        )
    
    # Crear nuevo access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(
    request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    Solicitar recuperación de contraseña.
    Genera un token de reset y lo envía por email (simulado).
    
    En producción, aquí enviarías un email con el token.
    """
    user = db.query(User).filter(User.email == request.email).first()
    
    # Por seguridad, no revelar si el email existe o no
    # Siempre retornar éxito
    if user:
        reset_token = create_password_reset_token(user.email)
        
        # TODO: Enviar email con el token
        # send_password_reset_email(user.email, reset_token)
        
        # Por ahora, solo lo retornamos (EN PRODUCCIÓN NUNCA HACER ESTO)
        # En producción, solo enviar por email
        return {
            "message": "Si el email existe, recibirás instrucciones para resetear tu contraseña",
            "reset_token": reset_token  # SOLO PARA DESARROLLO - ELIMINAR EN PRODUCCIÓN
        }
    
    return {
        "message": "Si el email existe, recibirás instrucciones para resetear tu contraseña"
    }


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(
    reset_data: PasswordReset,
    db: Session = Depends(get_db)
):
    """
    Restablecer contraseña usando el token de reset.
    """
    email = verify_token(reset_data.token, token_type="password_reset")
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token de reset inválido o expirado"
        )
    
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Actualizar password
    user.hashed_password = get_password_hash(reset_data.new_password)
    db.commit()
    
    # Invalidar el token de reset
    invalidate_token(reset_data.token)
    
    return {"message": "Contraseña actualizada correctamente"}
