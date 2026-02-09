from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1.api import api_router
from app.core.config import settings
from app.db.database import engine
from app.db.base import Base
import os

# NO crear tablas aquí - usar Alembic en producción
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crear directorio de uploads si no existe
UPLOADS_DIR = "uploads"
PRODUCTS_UPLOAD_DIR = os.path.join(UPLOADS_DIR, "products")
os.makedirs(PRODUCTS_UPLOAD_DIR, exist_ok=True)

# Montar archivos estáticos para servir imágenes
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Incluir routers
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API de Punto de Venta"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
