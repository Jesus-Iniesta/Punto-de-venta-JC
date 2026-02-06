from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime, date
from enum import Enum


class SaleStatus(str, Enum):
    """Estados posibles de una venta"""
    PENDING = "PENDING"
    PARTIAL = "PARTIAL"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class PaymentMethod(str, Enum):
    """Métodos de pago disponibles"""
    CASH = "CASH"
    CARD = "CARD"
    TRANSFER = "TRANSFER"
    MIXED = "MIXED"


class SaleBase(BaseModel):
    """Campos comunes de una venta"""
    product_id: int = Field(..., gt=0, description="ID del producto vendido")
    seller_id: int = Field(..., gt=0, description="ID del vendedor")
    quantity: int = Field(..., gt=0, description="Cantidad vendida")
    discount: float = Field(default=0.0, ge=0, description="Descuento aplicado")
    subtotal: Optional[float] = Field(..., ge=0, description="Subtotal antes de descuentos")
    payment_method: PaymentMethod = Field(..., description="Método de pago")
    notes: Optional[str] = Field(None, description="Notas adicionales de la venta")
    due_date: Optional[date] = Field(None, description="Fecha límite de pago (para ventas pendientes)")


class SaleCreate(SaleBase):
    """Schema para crear una nueva venta (POST request)"""
    amount_paid: float = Field(default=0.0, ge=0, description="Monto inicial pagado")
    
    @field_validator('amount_paid')
    def validate_amount_paid(cls, v):
        if v < 0:
            raise ValueError('El monto pagado no puede ser negativo')
        return v


class SaleUpdate(BaseModel):
    """Schema para actualizar una venta (PUT/PATCH request)
    Todos los campos son opcionales. Solo se permite si status es PENDING o PARTIAL"""
    product_id: Optional[int] = Field(None, gt=0, description="ID del producto vendido")
    seller_id: Optional[int] = Field(None, gt=0, description="ID del vendedor")
    quantity: Optional[int] = Field(None, gt=0, description="Cantidad vendida")
    discount: Optional[float] = Field(None, ge=0, description="Descuento aplicado")
    payment_method: Optional[PaymentMethod] = Field(None, description="Método de pago")
    notes: Optional[str] = Field(None, description="Notas adicionales")
    due_date: Optional[date] = Field(None, description="Fecha límite de pago")


class SalePayment(BaseModel):
    """Schema para registrar un pago en una venta"""
    amount: float = Field(..., gt=0, description="Monto del pago")
    payment_method: Optional[PaymentMethod] = Field(None, description="Método de pago (opcional)")
    notes: Optional[str] = Field(None, description="Notas del pago")
    
    @field_validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('El monto del pago debe ser mayor a 0')
        return v


class SaleStatusUpdate(BaseModel):
    """Schema para cambiar el estado de una venta"""
    status: SaleStatus = Field(..., description="Nuevo estado de la venta")
    reason: Optional[str] = Field(None, description="Razón del cambio de estado")


class ProductInfo(BaseModel):
    """Información del producto en la venta"""
    id: int
    name: str
    description: Optional[str]
    cost_price: float
    price: float
    image_url: Optional[str]
    
    class Config:
        from_attributes = True


class SellerInfo(BaseModel):
    """Información del vendedor en la venta"""
    id: int
    name: str
    contact_info: Optional[str]
    
    class Config:
        from_attributes = True


class SaleInDB(SaleBase):
    """Schema que representa una venta en la base de datos
    Incluye campos generados automáticamente"""
    id: int
    status: SaleStatus
    subtotal: float
    total_price: float
    amount_paid: float
    amount_remaining: float
    created_at: datetime
    
    class Config:
        from_attributes = True  # Permite crear desde ORM models


class Sale(SaleInDB):
    """Schema de respuesta (GET request) con información completa"""
    product: Optional[ProductInfo] = None
    seller: Optional[SellerInfo] = None
    
    class Config:
        from_attributes = True


class SaleWithDetails(Sale):
    """Schema de respuesta con detalles completos del producto, vendedor y cálculos de ganancia"""
    product: ProductInfo = Field(..., description="Información detallada del producto")
    seller: SellerInfo = Field(..., description="Información del vendedor")
    profit: float = Field(..., description="Ganancia de la venta (precio de venta - costo)")
    profit_margin_percentage: float = Field(..., description="Porcentaje de ganancia")
    
    class Config:
        from_attributes = True


