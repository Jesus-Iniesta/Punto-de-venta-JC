#!/bin/bash

# ============================================
# Script de Prueba - Configuración de Producción
# ============================================

set -e  # Salir si hay algún error

echo "🧪 Iniciando pruebas de la configuración de producción..."
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que existe .env.production
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ ERROR: No existe el archivo .env.production${NC}"
    echo "Ejecuta: cp .env.production.example .env.production"
    echo "Y configura las variables con valores reales"
    exit 1
fi

echo -e "${GREEN}✅ Archivo .env.production encontrado${NC}"
echo ""

# Verificar que Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ ERROR: Docker no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker instalado${NC}"

# Verificar que Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ ERROR: Docker Compose no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker Compose instalado${NC}"
echo ""

# Construir imágenes
echo "🏗️  Construyendo imágenes de producción..."
docker-compose -f docker-compose.prod.yml build

echo -e "${GREEN}✅ Imágenes construidas exitosamente${NC}"
echo ""

# Iniciar servicios
echo "🚀 Iniciando servicios..."
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

echo -e "${YELLOW}⏳ Esperando que los servicios estén listos (puede tomar ~40 segundos)...${NC}"
sleep 45

echo ""
echo "📊 Estado de los contenedores:"
docker ps --filter "name=punto_venta" --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "🔍 Verificando health checks..."

# Verificar PostgreSQL
if docker exec punto_venta_db_prod pg_isready -U puntoventauser &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL: Healthy${NC}"
else
    echo -e "${RED}❌ PostgreSQL: No responde${NC}"
fi

# Verificar Redis
if docker exec punto_venta_redis_prod redis-cli ping &> /dev/null; then
    echo -e "${GREEN}✅ Redis: Healthy${NC}"
else
    echo -e "${RED}❌ Redis: No responde${NC}"
fi

# Verificar Backend
if docker exec punto_venta_backend_prod wget --no-verbose --tries=1 --spider http://localhost:8000/health &> /dev/null; then
    echo -e "${GREEN}✅ Backend: Healthy${NC}"
else
    echo -e "${RED}❌ Backend: No responde${NC}"
    echo "Ver logs: docker logs punto_venta_backend_prod"
fi

# Verificar Frontend
if docker exec punto_venta_frontend_prod wget --no-verbose --tries=1 --spider http://localhost/ &> /dev/null; then
    echo -e "${GREEN}✅ Frontend: Healthy${NC}"
else
    echo -e "${RED}❌ Frontend: No responde${NC}"
    echo "Ver logs: docker logs punto_venta_frontend_prod"
fi

echo ""
echo "🌐 Probando endpoints públicos..."

# Probar API desde el host
if curl -f http://localhost/api/health &> /dev/null; then
    echo -e "${GREEN}✅ API accesible desde http://localhost/api/health${NC}"
else
    echo -e "${RED}❌ API no accesible${NC}"
fi

# Probar Frontend desde el host
if curl -f http://localhost/ &> /dev/null; then
    echo -e "${GREEN}✅ Frontend accesible desde http://localhost/${NC}"
else
    echo -e "${RED}❌ Frontend no accesible${NC}"
fi

echo ""
echo "🔐 Verificando configuraciones de seguridad..."

# Verificar que backend NO expone puerto 8000 al host
if docker ps --filter "name=punto_venta_backend_prod" --format "{{.Ports}}" | grep "0.0.0.0:8000" &> /dev/null; then
    echo -e "${RED}⚠️  ADVERTENCIA: Backend expone puerto 8000 públicamente (no debería)${NC}"
else
    echo -e "${GREEN}✅ Backend no expone puertos públicos (correcto)${NC}"
fi

# Verificar que PostgreSQL NO expone puerto al host
if docker ps --filter "name=punto_venta_db_prod" --format "{{.Ports}}" | grep "0.0.0.0:5432" &> /dev/null; then
    echo -e "${RED}⚠️  ADVERTENCIA: PostgreSQL expone puerto 5432 públicamente${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL no expone puertos públicos (correcto)${NC}"
fi

# Verificar que Redis NO expone puerto al host
if docker ps --filter "name=punto_venta_redis_prod" --format "{{.Ports}}" | grep "0.0.0.0:6379" &> /dev/null; then
    echo -e "${RED}⚠️  ADVERTENCIA: Redis expone puerto 6379 públicamente${NC}"
else
    echo -e "${GREEN}✅ Redis no expone puertos públicos (correcto)${NC}"
fi

echo ""
echo "📋 Resumen de volúmenes:"
docker volume ls --filter "name=puntoventa" --format "table {{.Name}}\t{{.Driver}}"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Pruebas completadas!${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🎯 Próximos pasos:"
echo "   1. Ejecutar migraciones:"
echo "      docker exec -it punto_venta_backend_prod alembic upgrade head"
echo ""
echo "   2. Crear usuario admin (si es necesario):"
echo "      docker exec -it punto_venta_backend_prod python create_admin.py"
echo ""
echo "   3. Ver logs en tiempo real:"
echo "      docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "   4. Acceder a la aplicación:"
echo "      http://localhost/"
echo ""
echo "   5. Detener servicios:"
echo "      docker-compose -f docker-compose.prod.yml down"
echo ""
echo "📖 Ver más detalles en DEPLOY.md"
echo ""
