import redis
import json
import uuid
from typing import Optional, Dict, Any
from datetime import timedelta
from app.core.config import settings


class SessionStore:
    """Manejo de sesiones con Redis"""
    
    def __init__(self):
        self.redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
            decode_responses=True
        )
    
    def create_session(self, user_id: int, username: str, role: str) -> str:
        """
        Crear una nueva sesión y retornar el session_id
        """
        session_id = str(uuid.uuid4())
        session_data = {
            "user_id": user_id,
            "username": username,
            "role": role
        }
        
        # Guardar en Redis con TTL
        self.redis_client.setex(
            f"session:{session_id}",
            timedelta(seconds=settings.SESSION_EXPIRE_SECONDS),
            json.dumps(session_data)
        )
        
        return session_id
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtener datos de sesión desde Redis
        """
        session_key = f"session:{session_id}"
        session_data = self.redis_client.get(session_key)
        
        if session_data:
            return json.loads(session_data)
        return None
    
    def delete_session(self, session_id: str) -> bool:
        """
        Eliminar sesión de Redis
        """
        session_key = f"session:{session_id}"
        result = self.redis_client.delete(session_key)
        return result > 0
    
    def refresh_session(self, session_id: str) -> bool:
        """
        Refrescar TTL de sesión (extender expiración)
        """
        session_key = f"session:{session_id}"
        result = self.redis_client.expire(
            session_key,
            timedelta(seconds=settings.SESSION_EXPIRE_SECONDS)
        )
        return result > 0


# Instancia global del store de sesión
session_store = SessionStore()
