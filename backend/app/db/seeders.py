"""
Seeders para datos iniciales de la base de datos.
Ejecutar: python -m app.db.seeders
"""
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.db.database import SessionLocal, engine
from app.models.user import User
from app.models.product import Product
from app.models.sellers import Sellers
from app.core.security import get_password_hash


def create_admin_user(db: Session) -> None:
    """Crear usuario administrador por defecto"""
    admin = db.query(User).filter(User.username == "admin").first()
    
    if not admin:
        admin = User(
            username="admin",
            email="admin@puntoventa.com",
            full_name="Administrador",
            hashed_password=get_password_hash("Admin123"),  # Cambiar en producción
            role="admin",
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"✓ Usuario admin creado: username='admin', password='Admin123'")
    else:
        print("✓ Usuario admin ya existe")


def create_test_user(db: Session) -> None:
    """Crear usuario de prueba"""
    test_user = db.query(User).filter(User.username == "usuario").first()
    
    if not test_user:
        test_user = User(
            username="usuario",
            email="usuario@puntoventa.com",
            full_name="Usuario de Prueba",
            hashed_password=get_password_hash("Usuario123"),
            role="user",
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        print(f"✓ Usuario de prueba creado: username='usuario', password='Usuario123'")
    else:
        print("✓ Usuario de prueba ya existe")


def create_test_sellers(db: Session) -> None:
    """Crear vendedores de prueba"""
    sellers_data = [
        {
            "name": "Juan Pérez",
            "contact_info": "juan.perez@email.com | 555-1234"
        },
        {
            "name": "María González",
            "contact_info": "maria.gonzalez@email.com | 555-5678"
        },
        {
            "name": "Carlos Rodríguez",
            "contact_info": "carlos.rodriguez@email.com | 555-9012"
        }
    ]
    
    created = 0
    for seller_data in sellers_data:
        existing = db.query(Sellers).filter(Sellers.name == seller_data["name"]).first()
        if not existing:
            seller = Sellers(
                name=seller_data["name"],
                contact_info=seller_data["contact_info"],
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(seller)
            created += 1
    
    if created > 0:
        db.commit()
        print(f"✓ {created} vendedores de prueba creados")
    else:
        print("✓ Vendedores de prueba ya existen")


def create_test_products(db: Session) -> None:
    """Crear productos de prueba"""
    products_data = [
        {
            "name": "Laptop Dell XPS 15",
            "description": "Laptop profesional con procesador Intel i7",
            "cost_price": 800.00,
            "price": 1200.00,
            "stock": 10,
        },
        {
            "name": "Mouse Logitech MX Master 3",
            "description": "Mouse ergonómico inalámbrico",
            "cost_price": 50.00,
            "price": 80.00,
            "stock": 25,
        },
        {
            "name": "Teclado Mecánico Keychron K2",
            "description": "Teclado mecánico compacto inalámbrico",
            "cost_price": 60.00,
            "price": 95.00,
            "stock": 15,
        },
        {
            "name": "Monitor LG 27 4K",
            "description": "Monitor UHD 4K de 27 pulgadas",
            "cost_price": 300.00,
            "price": 450.00,
            "stock": 8,
        },
        {
            "name": "Audífonos Sony WH-1000XM4",
            "description": "Audífonos con cancelación de ruido",
            "cost_price": 200.00,
            "price": 320.00,
            "stock": 12,
        },
        {
            "name": "Webcam Logitech C920",
            "description": "Webcam Full HD 1080p",
            "cost_price": 40.00,
            "price": 70.00,
            "stock": 20,
        },
        {
            "name": "SSD Samsung 1TB",
            "description": "Disco SSD NVMe 1TB",
            "cost_price": 80.00,
            "price": 130.00,
            "stock": 30,
        },
        {
            "name": "Router TP-Link AX3000",
            "description": "Router WiFi 6 de alta velocidad",
            "cost_price": 70.00,
            "price": 110.00,
            "stock": 18,
        }
    ]
    
    created = 0
    for product_data in products_data:
        existing = db.query(Product).filter(Product.name == product_data["name"]).first()
        if not existing:
            # Calcular profit_margin
            profit = product_data["price"] - product_data["cost_price"]
            profit_margin = (profit / product_data["price"]) * 100
            
            product = Product(
                name=product_data["name"],
                description=product_data["description"],
                cost_price=product_data["cost_price"],
                price=product_data["price"],
                profit_margin=profit_margin,
                stock=product_data["stock"],
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(product)
            created += 1
    
    if created > 0:
        db.commit()
        print(f"✓ {created} productos de prueba creados")
    else:
        print("✓ Productos de prueba ya existen")


def seed_database():
    """Ejecutar todos los seeders"""
    db = SessionLocal()
    
    try:
        print("\n🌱 Iniciando seeders...\n")
        
        print("📊 Creando datos de usuarios...")
        create_admin_user(db)
        create_test_user(db)
        
        print("\n📊 Creando vendedores de prueba...")
        create_test_sellers(db)
        
        print("\n📊 Creando productos de prueba...")
        create_test_products(db)
        
        print("\n✅ Seeders completados exitosamente!\n")
        print("=" * 50)
        print("CREDENCIALES DE ACCESO:")
        print("=" * 50)
        print("Admin:")
        print("  Username: admin")
        print("  Password: Admin123")
        print("\nUsuario:")
        print("  Username: usuario")
        print("  Password: Usuario123")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ Error al ejecutar seeders: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
