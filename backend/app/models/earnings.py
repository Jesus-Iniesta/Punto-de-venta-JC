from sqlalchemy import Column, Integer, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base
from sqlalchemy.sql.sqltypes import TIMESTAMP

class Earnings(Base):
    __tablename__ = "earnings"
    
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    amount = Column(Float, nullable=False)
    is_recorded = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, nullable=False)
    
    sale = relationship("Sales", back_populates="earnings")