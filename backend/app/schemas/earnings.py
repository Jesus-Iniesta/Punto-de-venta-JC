from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class EarningsBase(BaseModel):
    """Campos comunes de earnings"""
    sale_id: int = Field(..., gt=0, description="ID de la venta asociada")
    product_id: int = Field(..., gt=0, description="ID del producto vendido")
    cost_price: float = Field(..., gt=0, description="Precio de costo al momento de la venta")
    sale_price: float = Field(..., gt=0, description="Precio de venta")
    quantity: int = Field(..., gt=0, description="Cantidad vendida")


class EarningsCreate(EarningsBase):
    """Schema para crear un registro de earnings
    Generalmente esto se hace automáticamente al completar una venta"""
    pass


class EarningsInDB(EarningsBase):
    """Schema que representa earnings en la base de datos
    Incluye campos calculados automáticamente"""
    id: int
    total_cost: float = Field(..., description="Costo total (cost_price * quantity)")
    total_revenue: float = Field(..., description="Ingreso total (sale_price * quantity)")
    profit: float = Field(..., description="Ganancia (total_revenue - total_cost)")
    profit_margin: float = Field(..., description="Margen de ganancia en %")
    is_recorded: bool = Field(default=False, description="Si el registro está confirmado")
    created_at: datetime
    
    class Config:
        from_attributes = True


class Earnings(EarningsInDB):
    """Schema de respuesta (GET request)"""
    pass


class EarningsSummary(BaseModel):
    """Resumen general de ganancias"""
    total_invested: float = Field(..., description="Total invertido en productos (suma de cost_price)")
    total_sold: float = Field(..., description="Total vendido (suma de ventas completadas)")
    gross_profit: float = Field(..., description="Ganancia bruta (total_sold - total_invested)")
    net_profit: Optional[float] = Field(None, description="Ganancia neta (después de gastos opcionales)")
    average_profit_margin: float = Field(..., description="Margen de ganancia promedio en %")
    status: str = Field(..., description="PROFIT (ganancia) o LOSS (pérdida)")
    total_sales: int = Field(..., description="Número total de ventas completadas")
    
    class Config:
        from_attributes = True


class EarningsByProduct(BaseModel):
    """Ganancias desglosadas por producto"""
    product_id: int
    product_name: str
    quantity_sold: int = Field(..., description="Cantidad total vendida del producto")
    total_invested: float = Field(..., description="Total invertido en este producto")
    total_generated: float = Field(..., description="Total generado por ventas")
    profit: float = Field(..., description="Ganancia/pérdida del producto")
    profit_margin: float = Field(..., description="Margen de ganancia en %")
    
    class Config:
        from_attributes = True


class EarningsByPeriod(BaseModel):
    """Ganancias por período de tiempo"""
    period: str = Field(..., description="Período (día, semana, mes, año)")
    start_date: datetime = Field(..., description="Fecha inicio del período")
    end_date: datetime = Field(..., description="Fecha fin del período")
    total_revenue: float = Field(..., description="Total de ingresos en el período")
    total_cost: float = Field(..., description="Total de costos en el período")
    profit: float = Field(..., description="Ganancia en el período")
    profit_margin: float = Field(..., description="Margen de ganancia en %")
    sales_count: int = Field(..., description="Número de ventas en el período")
    
    class Config:
        from_attributes = True


class EarningsBySeller(BaseModel):
    """Ganancias por vendedor"""
    seller_id: int
    seller_name: str
    total_sales: int = Field(..., description="Total de ventas del vendedor")
    total_revenue: float = Field(..., description="Total de ingresos generados")
    total_cost: float = Field(..., description="Total de costos")
    profit: float = Field(..., description="Ganancia generada por el vendedor")
    commission: Optional[float] = Field(None, description="Comisión del vendedor (si aplica)")
    
    class Config:
        from_attributes = True


class InvestmentRecord(BaseModel):
    """Registro de inversión inicial"""
    amount: float = Field(..., gt=0, description="Capital invertido")
    description: str = Field(..., description="Descripción de la inversión")
    date: datetime = Field(..., description="Fecha de la inversión")
    
    class Config:
        from_attributes = True
