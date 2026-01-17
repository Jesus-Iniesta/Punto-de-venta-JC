from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SaleBase(BaseModel):
    """Campos comunes de una venta"""
    product_id: int = Field(..., description="ID del producto vendido")
    quantity: int = Field(..., gt=0, description="Cantidad vendida")
    total_price: float = Field(..., gt=0, description="Precio total de la venta")
    is_completed: bool = Field(default=False, description="Indica si la venta está completada")
    
    
class SaleCreate(SaleBase):
    """Schema para crear una nueva venta (POST request)"""
    pass


class SaleUpdate(BaseModel):
    """Schema para actualizar una venta (PUT/PATCH request)
    Todos los campos son opcionales"""
    product_id: Optional[int] = Field(None, description="ID del producto vendido")
    quantity: Optional[int] = Field(None, gt=0, description="Cantidad vendida")
    total_price: Optional[float] = Field(None, gt=0, description="Precio total de la venta")
    is_completed: Optional[bool] = Field(None, description="Indica si la venta está completada")
    
class SaleInDB(SaleBase):
    """Schema que representa una venta en la base de datos
    Incluye campos generados automáticamente"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True  # Permite crear desde ORM models
        
class Sale(SaleInDB):
    """Schema de respuesta (GET request)
    Es el mismo que SaleInDB en este caso"""
    pass

