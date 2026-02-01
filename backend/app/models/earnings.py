from sqlalchemy import Column, Integer, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base
from sqlalchemy.sql.sqltypes import TIMESTAMP

class Earnings(Base):
    __tablename__ = "earnings"
    
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    cost_price = Column(Float, nullable=False) #precio de costo del producto al momento de venta
    sale_price = Column(Float, nullable=False) #precio de venta del producto
    quantity = Column(Integer, nullable=False) #cantidad vendida del producto
    total_cost = Column(Float, nullable=False) #total costo = cost_price * quantity
    total_revenue = Column(Float, nullable=False)# total revenue = sale_price * quantity
    profit = Column(Float, nullable=False) #profit = total_revenue - total_cost
    profit_margin = Column(Float, nullable=False) #profit margin = (profit / total_revenue) * 100
    is_recorded = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, nullable=False)
    
    sale = relationship("Sales", back_populates="earnings")
    product = relationship("Product", back_populates="earnings")