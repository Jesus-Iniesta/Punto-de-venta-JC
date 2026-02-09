#!/bin/bash

# ============================================
# Script de Configuración de Dominio Personalizado
# ============================================

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🌐 Configurador de Dominio Personalizado - Punto de Venta"
echo "=========================================================="
echo ""

# Solicitar dominio
read -p "Ingresa tu dominio (ej: ventasapp.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ Error: Debes proporcionar un dominio${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📝 Dominio a configurar: $DOMAIN${NC}"
echo ""

# Preguntar si quiere SSL
read -p "¿Quieres configurar SSL/HTTPS con Let's Encrypt? (s/n): " SETUP_SSL

if [ "$SETUP_SSL" = "s" ] || [ "$SETUP_SSL" = "S" ]; then
    read -p "Ingresa tu email para Let's Encrypt: " EMAIL
    
    if [ -z "$EMAIL" ]; then
        echo -e "${RED}❌ Error: Debes proporcionar un email${NC}"
        exit 1
    fi
    
    echo ""
    echo "🔐 Se configurará SSL/HTTPS"
    echo ""
    
    # Usar configuración SSL
    if [ ! -f "frontend/nginx.ssl.conf" ]; then
        echo -e "${RED}❌ Error: No se encuentra frontend/nginx.ssl.conf${NC}"
        exit 1
    fi
    
    # Hacer backup del nginx.conf actual
    if [ -f "frontend/nginx.conf" ]; then
        cp frontend/nginx.conf frontend/nginx.conf.backup
        echo -e "${GREEN}✅ Backup creado: frontend/nginx.conf.backup${NC}"
    fi
    
    # Copiar configuración SSL y reemplazar dominio
    cp frontend/nginx.ssl.conf frontend/nginx.conf
    sed -i "s/tudominio.com/$DOMAIN/g" frontend/nginx.conf
    
    echo -e "${GREEN}✅ Configuración SSL aplicada en frontend/nginx.conf${NC}"
    echo ""
    
    # Crear directorios para certbot
    mkdir -p data/certbot/conf
    mkdir -p data/certbot/www
    
    echo -e "${GREEN}✅ Directorios de certbot creados${NC}"
    echo ""
    
    # Instrucciones para docker-compose
    echo -e "${YELLOW}⚠️  IMPORTANTE: Debes agregar Certbot a docker-compose.prod.yml${NC}"
    echo ""
    echo "Agrega esto al archivo docker-compose.prod.yml:"
    echo ""
    echo "services:"
    echo "  certbot:"
    echo "    image: certbot/certbot"
    echo "    container_name: punto_venta_certbot"
    echo "    volumes:"
    echo "      - ./data/certbot/conf:/etc/letsencrypt"
    echo "      - ./data/certbot/www:/var/www/certbot"
    echo "    entrypoint: \"/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait \\\$\\\${!}; done;'\""
    echo ""
    echo "  frontend:"
    echo "    ports:"
    echo "      - \"80:80\""
    echo "      - \"443:443\"  # Agregar esta línea"
    echo "    volumes:"
    echo "      - ./data/certbot/conf:/etc/letsencrypt"
    echo "      - ./data/certbot/www:/var/www/certbot"
    echo ""
    
    read -p "Presiona ENTER cuando hayas actualizado docker-compose.prod.yml..."
    
    echo ""
    echo "🚀 Iniciando frontend para obtener certificado..."
    docker-compose -f docker-compose.prod.yml up -d frontend
    
    echo "⏳ Esperando 15 segundos..."
    sleep 15
    
    echo ""
    echo "📜 Obteniendo certificado SSL..."
    docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
      --webroot \
      --webroot-path=/var/www/certbot \
      --email $EMAIL \
      --agree-tos \
      --no-eff-email \
      -d $DOMAIN \
      -d www.$DOMAIN
    
    echo ""
    echo "🔄 Reconstruyendo servicios..."
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml build frontend
    docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
    
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ Configuración SSL completada!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════${NC}"
    echo ""
    echo "🌐 Tu aplicación está disponible en:"
    echo "   https://$DOMAIN"
    echo "   https://www.$DOMAIN"
    echo ""
    
else
    # Configuración HTTP simple
    echo "📝 Se configurará HTTP simple (sin SSL)"
    echo ""
    
    # Hacer backup
    if [ -f "frontend/nginx.conf" ]; then
        cp frontend/nginx.conf frontend/nginx.conf.backup
        echo -e "${GREEN}✅ Backup creado: frontend/nginx.conf.backup${NC}"
    fi
    
    # Reemplazar dominio en nginx.conf
    sed -i "s/server_name localhost;/server_name $DOMAIN www.$DOMAIN;/" frontend/nginx.conf
    
    echo -e "${GREEN}✅ Configuración aplicada en frontend/nginx.conf${NC}"
    echo ""
    
    echo "🔄 Reconstruyendo servicios..."
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml build frontend
    docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
    
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ Configuración HTTP completada!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════${NC}"
    echo ""
    echo "🌐 Tu aplicación está disponible en:"
    echo "   http://$DOMAIN"
    echo "   http://www.$DOMAIN"
    echo ""
    echo -e "${YELLOW}⚠️  Advertencia: HTTP no es seguro para producción.${NC}"
    echo "   Se recomienda configurar SSL/HTTPS."
    echo ""
fi

echo "📋 Checklist:"
echo "   1. Verifica que los registros DNS estén propagados:"
echo "      dig +short $DOMAIN"
echo ""
echo "   2. Prueba la aplicación:"
echo "      curl https://$DOMAIN/api/health"
echo ""
echo "   3. Ver logs:"
echo "      docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "📖 Ver más detalles en DOMAIN_SETUP.md"
