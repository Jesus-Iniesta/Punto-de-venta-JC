from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SellerBase(BaseModel):
    """Campos comunes de un vendedor"""
    name: str = Field(..., description="Nombre del vendedor")
    contact_info: str = Field(..., description="Información de contacto del vendedor")
    is_active: bool = Field(default=True, description="Indica si el vendedor está activo")
    
class SellerCreate(SellerBase):
    """Schema para crear un nuevo vendedor (POST request)"""
    pass

class SellerUpdate(BaseModel):
    """Schema para actualizar un vendedor (PUT/PATCH request)
    Todos los campos son opcionales"""
    name: Optional[str] = Field(None, description="Nombre del vendedor")
    contact_info: Optional[str] = Field(None, description="Información de contacto del vendedor")
    is_active: Optional[bool] = Field(None, description="Indica si el vendedor está activo")
    
class SellerInDB(SellerBase):
    """Schema que representa un vendedor en la base de datos
    Incluye campos generados automáticamente"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True  # Permite crear desde ORM models

class Seller(SellerInDB):
    """Schema de respuesta (GET request)
    Es el mismo que SellerInDB en este caso"""
    pass

