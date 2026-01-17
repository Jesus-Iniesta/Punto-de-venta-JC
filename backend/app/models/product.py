from sqlalchemy import Column, Integer, String, Float, Boolean
from app.db.base import Base


class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    sku = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)
