from sqlalchemy import Column, Integer, Float, String, DateTime
from sqlalchemy.sql import func
from app.db.base import Base


class Investment(Base):
    """
    Modelo para registrar inversiones iniciales de capital.
    
    Esto es independiente de las ventas y earnings, representa
    el capital invertido inicialmente en el negocio (compra de
    productos, gastos iniciales, etc.)
    """
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    description = Column(String(500), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    registered_by = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Investment(id={self.id}, amount={self.amount}, description='{self.description}')>"
