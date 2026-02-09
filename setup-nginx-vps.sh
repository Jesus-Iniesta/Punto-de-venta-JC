#!/bin/bash

# ============================================
# Script de Configuración Nginx Reverse Proxy
# Para Opción A (Múltiples Sitios)
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="flores-eternas-cyj.me"
EMAIL="iniestavalverdejesus4@gmail.com"

echo "════════════════════════════════════════════════════════════"
echo "  🔧 Configuración Nginx Reverse Proxy - Flores Eternas"
echo "════════════════════════════════════════════════════════════"
echo ""

# Verificar que estamos en el VPS
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ ERROR: Archivo .env.production no encontrado${NC}"
    echo "Este script debe ejecutarse desde el directorio del proyecto en el VPS"
    exit 1
fi

# ============================================
# PASO 1: Instalar dependencias
# ============================================
echo -e "${YELLOW}📦 PASO 1: Instalando dependencias...${NC}"
echo ""

if ! command -v nginx &> /dev/null; then
    sudo apt update
    sudo apt install -y nginx certbot python3-certbot-nginx
    echo -e "${GREEN}✅ Nginx y Certbot instalados${NC}"
else
    echo -e "${GREEN}✅ Nginx ya está instalado${NC}"
fi

echo ""

# ============================================
# PASO 2: Detener nginx temporalmente
# ============================================
echo -e "${YELLOW}⏸️  PASO 2: Deteniendo nginx temporalmente...${NC}"
echo ""

sudo systemctl stop nginx || true
echo -e "${GREEN}✅ Nginx detenido${NC}"
echo ""

# ============================================
# PASO 3: Iniciar contenedores Docker
# ============================================
echo -e "${YELLOW}🐳 PASO 3: Iniciando contenedores Docker...${NC}"
echo ""

# Asegurarse de que docker-compose usa puertos 8080/8443
if ! grep -q "8080:80" docker-compose.prod.yml; then
    echo -e "${RED}❌ ERROR: docker-compose.prod.yml no tiene puerto 8080${NC}"
    echo "Ejecuta primero: ./setup-multisite.sh y elige opción A"
    exit 1
fi

docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

echo -e "${YELLOW}⏳ Esperando que los servicios estén listos (60 segundos)...${NC}"
sleep 60

echo -e "${GREEN}✅ Contenedores iniciados${NC}"
echo ""

# Verificar que el contenedor responda
if curl -f http://localhost:8080/api/health &> /dev/null; then
    echo -e "${GREEN}✅ Backend respondiendo en localhost:8080${NC}"
else
    echo -e "${RED}⚠️  Backend no responde aún (puede tomar más tiempo)${NC}"
fi

echo ""

# ============================================
# PASO 4: Configurar nginx (solo HTTP primero)
# ============================================
echo -e "${YELLOW}⚙️  PASO 4: Configurando Nginx (HTTP)...${NC}"
echo ""

# Usar configuración inicial (solo HTTP)
sudo cp nginx-reverse-proxy-step1.conf /etc/nginx/sites-available/flores-eternas

# Remover enlace simbólico si existe
sudo rm -f /etc/nginx/sites-enabled/flores-eternas

# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/flores-eternas /etc/nginx/sites-enabled/

# Verificar configuración
if sudo nginx -t; then
    echo -e "${GREEN}✅ Configuración nginx válida${NC}"
else
    echo -e "${RED}❌ Error en configuración nginx${NC}"
    exit 1
fi

echo ""

# ============================================
# PASO 5: Iniciar nginx
# ============================================
echo -e "${YELLOW}🚀 PASO 5: Iniciando Nginx...${NC}"
echo ""

sudo systemctl start nginx
sudo systemctl enable nginx

echo -e "${GREEN}✅ Nginx iniciado${NC}"
echo ""

# Verificar que funciona
if curl -f http://$DOMAIN/api/health &> /dev/null; then
    echo -e "${GREEN}✅ Sitio accesible vía HTTP: http://$DOMAIN${NC}"
else
    echo -e "${YELLOW}⚠️  Sitio no accesible aún (verifica DNS)${NC}"
fi

echo ""

# ============================================
# PASO 6: Obtener certificado SSL
# ============================================
echo -e "${YELLOW}🔐 PASO 6: Obteniendo certificado SSL...${NC}"
echo ""

sudo certbot --nginx \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    -d $DOMAIN \
    -d www.$DOMAIN

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Certificado SSL obtenido${NC}"
    echo -e "${GREEN}✅ Nginx configurado con HTTPS automáticamente${NC}"
else
    echo -e "${RED}❌ Error obteniendo certificado SSL${NC}"
    echo "Posibles causas:"
    echo "  - DNS no propagado correctamente"
    echo "  - Firewall bloqueando puerto 80/443"
    echo "  - Dominio no apunta a esta IP"
    echo ""
    echo "Verifica DNS con: dig +short $DOMAIN"
    exit 1
fi

echo ""

# ============================================
# PASO 7: Ejecutar migraciones
# ============================================
echo -e "${YELLOW}📊 PASO 7: Ejecutando migraciones...${NC}"
echo ""

docker exec flores_eternas_backend_prod alembic upgrade head

echo -e "${GREEN}✅ Migraciones completadas${NC}"
echo ""

# ============================================
# RESUMEN FINAL
# ============================================
echo "════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ CONFIGURACIÓN COMPLETADA EXITOSAMENTE!${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "🌐 Tu aplicación está disponible en:"
echo "   https://$DOMAIN"
echo "   https://www.$DOMAIN"
echo ""
echo "📊 Estado de servicios:"
docker ps --filter "name=flores_eternas" --format "table {{.Names}}\t{{.Status}}"
echo ""
echo "🔧 Comandos útiles:"
echo "   Ver logs docker:     docker-compose -f docker-compose.prod.yml logs -f"
echo "   Ver logs nginx:      sudo tail -f /var/log/nginx/flores-eternas-*.log"
echo "   Reiniciar nginx:     sudo systemctl restart nginx"
echo "   Crear admin:         docker exec -it flores_eternas_backend_prod python create_admin.py"
echo ""
echo "📜 El certificado SSL se renovará automáticamente"
echo ""
