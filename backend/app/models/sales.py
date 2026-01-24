from sqlalchemy import Column, Enum, Integer, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base
from sqlalchemy.sql.sqltypes import Date, TIMESTAMP


class Sales(Base):
    __tablename__ = "sales"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("sellers.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    status = Column(
        Enum('PENDING', 'PARTIAL', 'COMPLETED', 'CANCELLED', name='sale_status'),
        default='PENDING',
        nullable=False
    ) # Estado de la venta actual
    subtotal = Column(Float, nullable=False) # Precio sin aplicar descuentos
    discount = Column(Float, default=0.0) # Descuento aplicado
    total_price = Column(Float, nullable=False) # Precio final después de descuentos
    amount_paid = Column(Float, default=0.0) # Monto pagado hasta ahora
    amount_remaining = Column(Float, nullable=False) # Monto restante por pagar
    payment_method = Column(
        Enum('CASH', 'CARD', 'TRANSFER', 'MIXED', name='payment_method'),
        nullable=False
    ) # Método de pago utilizado
    notes = Column(Text) # Notas adicionales sobre la venta
    due_date = Column(Date) # Fecha de vencimiento para pagos pendientes
    created_at = Column(TIMESTAMP, nullable=False)
    
    # Relaciones
    product = relationship("Product", back_populates="sales")
    seller = relationship("Sellers", back_populates="sales")
    earnings = relationship("Earnings", back_populates="sale")