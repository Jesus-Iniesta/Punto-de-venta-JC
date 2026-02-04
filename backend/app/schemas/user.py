from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Campos comunes (sin password ni created_at)"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str = Field(..., min_length=1)
    is_active: bool = Field(default=True)
    role: str = Field(default="user", pattern="^(user|admin)$")


class UserCreate(UserBase):
    """Para crear usuarios - incluye password"""
    password: str = Field(..., min_length=8)
    
    @field_validator('password')
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Debe tener al menos una mayúscula')
        if not any(c.isdigit() for c in v):
            raise ValueError('Debe tener al menos un número')
        return v


class UserUpdate(BaseModel):
    """Para actualizar - todos opcionales"""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=1)
    password: Optional[str] = Field(None, min_length=8)
    is_active: Optional[bool] = None
    role: Optional[str] = Field(None, pattern="^(user|admin)$")


class UserInDB(UserBase):
    """En DB - incluye id, created_at, hashed_password"""
    id: int
    hashed_password: str  # Guardas el hash, no el password
    created_at: datetime
    
    class Config:
        from_attributes = True


class User(UserBase):
    """Respuesta API - sin password"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: 'User'


class TokenData(BaseModel):
    username: Optional[str] = None


class RefreshToken(BaseModel):
    refresh_token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordReset(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)
    
    @field_validator('new_password')
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Debe tener al menos una mayúscula')
        if not any(c.isdigit() for c in v):
            raise ValueError('Debe tener al menos un número')
        return v
