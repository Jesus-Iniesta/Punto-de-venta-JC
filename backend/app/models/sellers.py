from datetime import datetime as DateTime
from sqlalchemy import Column, Integer, Text, String, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base
from sqlalchemy.sql.sqltypes import TIMESTAMP

class Sellers(Base):
    __tablename__ = "sellers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    contact_info = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, nullable=False, default=DateTime.now)
    
    # Relaciones
    sales = relationship("Sales", back_populates="seller")