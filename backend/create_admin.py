"""
Script para crear un usuario admin inicial
"""
from app.db.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from datetime import datetime

def create_admin_user():
    db = SessionLocal()
    
    try:
        # Verificar si ya existe un admin
        existing_admin = db.query(User).filter(User.username == "admin").first()
        
        if existing_admin:
            print("✓ Usuario admin ya existe")
            return
        
        # Crear usuario admin
        admin_user = User(
            username="admin",
            email="admin@flores.com",
            full_name="Administrador",
            hashed_password=get_password_hash("Admin123"),
            role="admin",
            is_active=True,
            created_at=datetime.now()
        )
        
        db.add(admin_user)
        db.commit()
        
        print("✓ Usuario admin creado exitosamente")
        print("\nCredenciales:")
        print("  Usuario: admin")
        print("  Contraseña: Admin123")
        print("\n⚠️  Cambia estas credenciales en producción")
        
    except Exception as e:
        print(f"✗ Error al crear usuario admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
