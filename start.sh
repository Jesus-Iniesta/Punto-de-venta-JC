#!/bin/bash

echo "🚀 Iniciando Punto de Venta en modo desarrollo..."

# Verificar que Docker esté corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker no está corriendo. Por favor inicia Docker primero."
    exit 1
fi

# Crear archivos .env si no existen
if [ ! -f backend/.env ]; then
    echo "📝 Creando backend/.env desde .env.example..."
    cp backend/.env.example backend/.env
fi

if [ ! -f frontend/.env ]; then
    echo "📝 Creando frontend/.env desde .env.example..."
    cp frontend/.env.example frontend/.env
fi

# Construir y levantar servicios
echo "🐳 Construyendo y levantando contenedores..."
docker-compose up --build -d

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 5

# Mostrar estado
echo ""
echo "✅ Servicios iniciados!"
echo ""
echo "📍 Accede a:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo "   PostgreSQL: localhost:5432"
echo ""
echo "Para ver logs: docker-compose logs -f"
echo "Para detener: docker-compose down"
