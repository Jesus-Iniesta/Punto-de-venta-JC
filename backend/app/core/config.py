from pydantic_settings import BaseSettings
from typing import List
from pydantic import field_validator


class Settings(BaseSettings):
    PROJECT_NAME: str
    API_V1_STR: str
    
    # Database - Sin valores por defecto, deben estar en .env
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"
    
    # Security - Sin valores por defecto inseguros
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Redis Session Store
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = ""
    SESSION_EXPIRE_SECONDS: int = 86400  # 24 horas
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    @field_validator('SECRET_KEY')
    def validate_secret_key(cls, v):
        if len(v) < 32:
            raise ValueError('SECRET_KEY debe tener al menos 32 caracteres')
        if v in ['your-secret-key-change-this-in-production', 'changeme', 'secret']:
            raise ValueError('SECRET_KEY no puede usar valores por defecto')
        return v
    
    @field_validator('POSTGRES_PASSWORD')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('POSTGRES_PASSWORD debe tener al menos 8 caracteres')
        return v
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = 'utf-8'


settings = Settings()
