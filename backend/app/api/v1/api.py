from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, products, sales, earnings, sellers

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
api_router.include_router(earnings.router, prefix="/earnings", tags=["earnings"])
api_router.include_router(sellers.router, prefix="/sellers", tags=["sellers"])