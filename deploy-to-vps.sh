#!/bin/bash

# ============================================
# Script de Despliegue a Producción VPS
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="flores-eternas-cyj.me"
VPS_IP="77.37.63.94"
EMAIL="iniestavalverdejesus4@gmail.com"  # CAMBIAR POR TU EMAIL REAL

echo "════════════════════════════════════════════════════════════"
echo "  🚀 DESPLIEGUE A PRODUCCIÓN - Punto de Venta"
echo "════════════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}Dominio:${NC} $DOMAIN"
echo -e "${BLUE}IP VPS:${NC} $VPS_IP"
echo ""

# ============================================
# PASO 1: Verificar DNS
# ============================================
echo -e "${YELLOW}📡 PASO 1: Verificando DNS...${NC}"
echo ""

DNS_CHECK=$(dig +short $DOMAIN | head -n 1)

if [ "$DNS_CHECK" = "$VPS_IP" ]; then
    echo -e "${GREEN}✅ DNS correcto: $DOMAIN → $VPS_IP${NC}"
else
    echo -e "${RED}❌ ERROR: DNS NO apunta a tu VPS${NC}"
    echo -e "${RED}   Actual: $DNS_CHECK${NC}"
    echo -e "${RED}   Esperado: $VPS_IP${NC}"
    echo ""
    echo "Configuración necesaria en tu registrador de dominios:"
    echo ""
    echo "  Tipo    Nombre    Valor"
    echo "  ----    ------    -----"
    echo "  A       @         $VPS_IP"
    echo "  A       www       $VPS_IP"
    echo ""
    echo "Espera 5-30 minutos para propagación DNS y vuelve a ejecutar."
    exit 1
fi

echo ""

# ============================================
# PASO 2: Verificar archivo .env.production
# ============================================
echo -e "${YELLOW}🔐 PASO 2: Verificando variables de entorno...${NC}"
echo ""

if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ ERROR: Archivo .env.production no encontrado${NC}"
    echo "Debe existir en la raíz del proyecto"
    exit 1
fi

# Verificar que no tenga valores por defecto
if grep -q "genera_un_string_aleatorio" .env.production; then
    echo -e "${RED}❌ ERROR: SECRET_KEY no ha sido generado${NC}"
    echo ""
    echo "Genera uno nuevo con:"
    echo "  openssl rand -hex 32"
    echo ""
    echo "Y actualiza el valor en .env.production"
    exit 1
fi

echo -e "${GREEN}✅ Archivo .env.production encontrado${NC}"
echo ""

# ============================================
# PASO 3: Verificar docker-compose.prod.yml
# ============================================
echo -e "${YELLOW}🐳 PASO 3: Verificando Docker Compose...${NC}"
echo ""

if ! grep -q "certbot:" docker-compose.prod.yml; then
    echo -e "${RED}❌ ERROR: Certbot no está configurado en docker-compose.prod.yml${NC}"
    exit 1
fi

if ! grep -q "443:443" docker-compose.prod.yml; then
    echo -e "${RED}❌ ERROR: Puerto 443 (HTTPS) no está expuesto${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker Compose configurado correctamente${NC}"
echo ""

# ============================================
# PASO 4: Crear directorios necesarios
# ============================================
echo -e "${YELLOW}📁 PASO 4: Creando directorios...${NC}"
echo ""

mkdir -p data/certbot/conf
mkdir -p data/certbot/www

echo -e "${GREEN}✅ Directorios creados${NC}"
echo ""

# ============================================
# PASO 5: Construir imágenes
# ============================================
echo -e "${YELLOW}🏗️  PASO 5: Construyendo imágenes Docker...${NC}"
echo ""

docker-compose -f docker-compose.prod.yml build

echo -e "${GREEN}✅ Imágenes construidas${NC}"
echo ""

# ============================================
# PASO 6: Copiar nginx.ssl.conf a nginx.conf
# ============================================
echo -e "${YELLOW}⚙️  PASO 6: Configurando Nginx para SSL...${NC}"
echo ""

if [ -f "frontend/nginx.conf" ]; then
    cp frontend/nginx.conf frontend/nginx.conf.http-backup
    echo "Backup creado: frontend/nginx.conf.http-backup"
fi

cp frontend/nginx.ssl.conf frontend/nginx.conf
echo -e "${GREEN}✅ Configuración SSL aplicada${NC}"
echo ""

# ============================================
# PASO 7: Iniciar servicios (sin SSL primero)
# ============================================
echo -e "${YELLOW}🚀 PASO 7: Iniciando servicios...${NC}"
echo ""

# Iniciar temporalmente con HTTP para obtener certificado
sed -i 's/listen 443 ssl http2;/# listen 443 ssl http2;/' frontend/nginx.conf
sed -i 's/ssl_/#ssl_/g' frontend/nginx.conf

docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

echo -e "${YELLOW}⏳ Esperando que los servicios estén listos (60 segundos)...${NC}"
sleep 60

echo -e "${GREEN}✅ Servicios iniciados${NC}"
echo ""

# ============================================
# PASO 8: Obtener certificado SSL
# ============================================
echo -e "${YELLOW}🔐 PASO 8: Obteniendo certificado SSL...${NC}"
echo ""

if [ "$EMAIL" = "tu@email.com" ]; then
    echo -e "${RED}❌ ERROR: Debes configurar tu email en este script (línea 12)${NC}"
    exit 1
fi

docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d $DOMAIN \
  -d www.$DOMAIN

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ ERROR: No se pudo obtener el certificado SSL${NC}"
    echo "Verifica que el DNS esté propagado correctamente"
    exit 1
fi

echo -e "${GREEN}✅ Certificado SSL obtenido${NC}"
echo ""

# ============================================
# PASO 9: Restaurar configuración SSL completa
# ============================================
echo -e "${YELLOW}🔄 PASO 9: Activando HTTPS...${NC}"
echo ""

# Restaurar nginx.conf completo
cp frontend/nginx.ssl.conf frontend/nginx.conf

# Reconstruir frontend
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build frontend
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

echo -e "${GREEN}✅ HTTPS activado${NC}"
echo ""

# ============================================
# PASO 10: Ejecutar migraciones
# ============================================
echo -e "${YELLOW}📊 PASO 10: Ejecutando migraciones de base de datos...${NC}"
echo ""

sleep 20  # Esperar que el backend esté listo

docker exec flores_eternas_backend_prod alembic upgrade head

echo -e "${GREEN}✅ Migraciones ejecutadas${NC}"
echo ""

# ============================================
# PASO 11: Verificar estado
# ============================================
echo -e "${YELLOW}🔍 PASO 11: Verificando servicios...${NC}"
echo ""

sleep 10

echo "Estado de contenedores:"
docker ps --filter "name=flores_eternas" --format "table {{.Names}}\t{{.Status}}"
echo ""

# Verificar endpoints
echo "Verificando endpoints..."

if curl -f -k https://$DOMAIN/api/health &> /dev/null; then
    echo -e "${GREEN}✅ API: https://$DOMAIN/api/health - OK${NC}"
else
    echo -e "${RED}⚠️  API no responde aún (puede tomar 1-2 minutos)${NC}"
fi

if curl -f -k https://$DOMAIN/ &> /dev/null; then
    echo -e "${GREEN}✅ Frontend: https://$DOMAIN - OK${NC}"
else
    echo -e "${RED}⚠️  Frontend no responde aún ${NC}"
fi

echo ""

# ============================================
# RESUMEN FINAL
# ============================================
echo "════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ DESPLIEGUE COMPLETADO EXITOSAMENTE!${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "🌐 Tu aplicación está disponible en:"
echo "   https://$DOMAIN"
echo "   https://www.$DOMAIN"
echo ""
echo "📚 URLs importantes:"
echo "   Frontend:  https://$DOMAIN"
echo "   API:       https://$DOMAIN/api"
echo "   Docs:      https://$DOMAIN/api/docs"
echo "   Health:    https://$DOMAIN/api/health"
echo ""
echo "🔧 Comandos útiles:"
echo "   Ver logs:      docker-compose -f docker-compose.prod.yml logs -f"
echo "   Reiniciar:     docker-compose -f docker-compose.prod.yml restart"
echo "   Detener:       docker-compose -f docker-compose.prod.yml down"
echo "   Crear admin:   docker exec -it punto_venta_backend_prod python create_admin.py"
echo ""
echo "📊 El certificado SSL se renovará automáticamente cada 60 días"
echo ""
echo "🎉 ¡Felicidades! Tu Punto de Venta está en producción"
echo ""
