from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base
from sqlalchemy.sql.sqltypes import TIMESTAMP


class Sales(Base):
    __tablename__ = "sales"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    total_price = Column(Float, nullable=False)
    is_completed = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, nullable=False)
    
    # Relaciones
    product = relationship("Product", back_populates="sales")
    earnings = relationship("Earnings", back_populates="sale")