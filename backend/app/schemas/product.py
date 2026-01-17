from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProductBase(BaseModel):
    """Schema base con los campos comunes de Product"""
    name: str = Field(..., description="Nombre del producto")
    description: Optional[str] = Field(None, description="Descripción del producto")
    price: float = Field(..., gt=0, description="Precio del producto")
    stock: int = Field(default=0, ge=0, description="Cantidad en inventario")
    image_url: Optional[str] = Field(None, description="URL de la imagen del producto")
    is_active: bool = Field(default=True, description="Si el producto está activo")


class ProductCreate(ProductBase):
    """Schema para crear un nuevo producto (POST request)"""
    pass


class ProductUpdate(BaseModel):
    """Schema para actualizar un producto (PUT/PATCH request)
    Todos los campos son opcionales"""
    name: Optional[str] = Field(None, description="Nombre del producto")
    description: Optional[str] = Field(None, description="Descripción del producto")
    price: Optional[float] = Field(None, gt=0, description="Precio del producto")
    stock: Optional[int] = Field(None, ge=0, description="Cantidad en inventario")
    image_url: Optional[str] = Field(None, description="URL de la imagen del producto")
    is_active: Optional[bool] = Field(None, description="Si el producto está activo")


class ProductInDB(ProductBase):
    """Schema que representa un producto en la base de datos
    Incluye campos generados automáticamente"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True  # Permite crear desde ORM models


class Product(ProductInDB):
    """Schema de respuesta (GET request)
    Es el mismo que ProductInDB en este caso"""
    pass
