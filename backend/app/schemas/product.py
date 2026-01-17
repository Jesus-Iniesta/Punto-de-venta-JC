from pydantic import BaseModel
from typing import Optional


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int = 0
    sku: str
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    sku: Optional[str] = None
    is_active: Optional[bool] = None


class ProductInDB(ProductBase):
    id: int
    
    class Config:
        from_attributes = True


class Product(ProductInDB):
    pass
