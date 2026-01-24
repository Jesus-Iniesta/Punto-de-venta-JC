from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


class ProductBase(BaseModel):
    """Schema base con los campos comunes de Product"""
    name: str = Field(..., description="Nombre del producto")
    description: Optional[str] = Field(None, description="Descripción del producto")
    cost_price: float = Field(..., gt=0, description="Precio de costo/inversión")
    price: Optional[float] = Field(None, gt=0, description="Precio de venta (se calcula automáticamente si no se proporciona)")
    profit_margin: Optional[float] = Field(None, ge=0, le=1000, description="Margen de ganancia en % (0-1000)")
    stock: int = Field(default=0, ge=0, description="Cantidad en inventario")
    image_url: Optional[str] = Field(None, description="URL de la imagen del producto")
    is_active: bool = Field(default=True, description="Si el producto está activo")


class ProductCreate(ProductBase):
    """Schema para crear un nuevo producto (POST request)"""
    
    @field_validator('price')
    def validate_price(cls, v, info):
        # Si se proporciona precio, validar que sea mayor al costo
        if v is not None:
            cost_price = info.data.get('cost_price')
            if cost_price and v <= cost_price:
                raise ValueError('El precio de venta debe ser mayor al precio de costo')
            if v > 1000000:
                raise ValueError('El precio parece demasiado alto')
        return v
    
    @field_validator('profit_margin')
    def validate_profit_margin(cls, v):
        if v is not None and (v < 0 or v > 1000):
            raise ValueError('El margen de ganancia debe estar entre 0 y 1000%')
        return v


class ProductUpdate(BaseModel):
    """Schema para actualizar un producto (PUT/PATCH request)
    Todos los campos son opcionales"""
    name: Optional[str] = Field(None, description="Nombre del producto")
    description: Optional[str] = Field(None, description="Descripción del producto")
    cost_price: Optional[float] = Field(None, gt=0, description="Precio de costo/inversión")
    price: Optional[float] = Field(None, gt=0, description="Precio de venta")
    profit_margin: Optional[float] = Field(None, ge=0, le=1000, description="Margen de ganancia en %")
    stock: Optional[int] = Field(None, ge=0, description="Cantidad en inventario")
    image_url: Optional[str] = Field(None, description="URL de la imagen del producto")
    is_active: Optional[bool] = Field(None, description="Si el producto está activo")


class ProductInDB(ProductBase):
    """Schema que representa un producto en la base de datos
    Incluye campos generados automáticamente"""
    id: int
    price: float  # En DB siempre tiene precio calculado
    created_at: datetime
    
    class Config:
        from_attributes = True  # Permite crear desde ORM models


class Product(ProductInDB):
    """Schema de respuesta (GET request)
    Es el mismo que ProductInDB en este caso"""
    pass
