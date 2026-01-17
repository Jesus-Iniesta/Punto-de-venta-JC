from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class EarningBase(BaseModel):
    """Schema base con los campos comunes de Earning"""
    sale_id: int = Field(..., description="ID de la venta asociada")
    amount: float = Field(..., description="Monto ganado")
    is_recorded: bool = Field(default=False, description="Si la ganancia ha sido registrada")
    
class EarningCreate(EarningBase):
    """Schema para crear una nueva ganancia (POST request)"""
    pass

class EarningInDB(EarningBase):
    """Schema que representa una ganancia en la base de datos
    Incluye campos generados automáticamente"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True  # Permite crear desde ORM models

class Earning(EarningInDB):
    """Schema de respuesta (GET request)
    Es el mismo que EarningInDB en este caso"""
    pass