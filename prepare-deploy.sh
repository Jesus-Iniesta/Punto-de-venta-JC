#!/bin/bash

# ============================================
# PREPARADOR PRE-DESPLIEGUE
# Ejecutar ANTES de subir al VPS
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "════════════════════════════════════════════════════════════"
echo "  🔧 PREPARADOR PRE-DESPLIEGUE - Punto de Venta"
echo "════════════════════════════════════════════════════════════"
echo ""

DOMAIN="flores-eternas-cyj.me"
VPS_IP="77.37.63.94"

# ============================================
# PASO 1: Verificar DNS
# ============================================
echo -e "${BLUE}[1/5]${NC} ${YELLOW}Verificando DNS...${NC}"
echo ""

DNS_CHECK=$(dig +short $DOMAIN | head -n 1 2>/dev/null || echo "")

if [ -z "$DNS_CHECK" ]; then
    echo -e "${RED}❌ DNS no configurado o no propagado${NC}"
    echo ""
    echo "🔧 ACCIÓN REQUERIDA:"
    echo "   Ve al panel de tu registrador de dominios y configura:"
    echo ""
    echo "   Tipo    Nombre    Valor           TTL"
    echo "   ----    ------    -----           ---"
    echo "   A       @         $VPS_IP         3600"
    echo "   A       www       $VPS_IP         3600"
    echo ""
    echo "   Espera 5-30 minutos para propagación"
    echo ""
    DNS_OK="NO"
elif [ "$DNS_CHECK" = "$VPS_IP" ]; then
    echo -e "${GREEN}✅ DNS correcto: $DOMAIN → $VPS_IP${NC}"
    DNS_OK="SI"
else
    echo -e "${YELLOW}⚠️  DNS apunta a: $DNS_CHECK${NC}"
    echo -e "${YELLOW}   Debería apuntar a: $VPS_IP${NC}"
    echo ""
    DNS_OK="NO"
fi

echo ""

# ============================================
# PASO 2: Generar secretos
# ============================================
echo -e "${BLUE}[2/5]${NC} ${YELLOW}Generando secretos de seguridad...${NC}"
echo ""

SECRET_KEY=$(openssl rand -hex 32)
REDIS_PASSWORD=$(openssl rand -hex 16)
POSTGRES_PASSWORD=$(openssl rand -hex 16 | tr -d '\n' && echo "!Prod2026")

echo -e "${GREEN}✅ Secretos generados${NC}"
echo ""

# ============================================
# PASO 3: Crear/Actualizar .env.production
# ============================================
echo -e "${BLUE}[3/5]${NC} ${YELLOW}Creando archivo .env.production...${NC}"
echo ""

cat > .env.production << EOF
# ===========================================
# CONFIGURACIÓN DE PRODUCCIÓN - PUNTO VENTA
# ===========================================
# Generado automáticamente el $(date)

# PostgreSQL
POSTGRES_USER=puntoventauser
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=puntoventa_prod

# Redis (para sesiones)
REDIS_PASSWORD=$REDIS_PASSWORD

# Backend JWT Secret
SECRET_KEY=$SECRET_KEY
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Puerto público
PORT=80
EOF

echo -e "${GREEN}✅ Archivo .env.production creado${NC}"
echo ""

# ============================================
# PASO 4: Mostrar credenciales
# ============================================
echo -e "${BLUE}[4/5]${NC} ${YELLOW}Credenciales generadas (GUÁRDALAS):${NC}"
echo ""
echo "════════════════════════════════════════════════════════════"
echo -e "${YELLOW}⚠️  IMPORTANTE: Guarda estas credenciales en lugar seguro${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}📊 PostgreSQL:${NC}"
echo "   Usuario:     puntoventauser"
echo "   Contraseña:  $POSTGRES_PASSWORD"
echo "   Base de datos: puntoventa_prod"
echo ""
echo -e "${BLUE}🔴 Redis:${NC}"
echo "   Contraseña:  $REDIS_PASSWORD"
echo ""
echo -e "${BLUE}🔑 JWT Secret Key:${NC}"
echo "   $SECRET_KEY"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Guardar en archivo temporal
cat > .env.credentials << EOF
CREDENCIALES DE PRODUCCIÓN - $(date)
=====================================

PostgreSQL:
  Usuario: puntoventauser
  Contraseña: $POSTGRES_PASSWORD
  Base de datos: puntoventa_prod

Redis:
  Contraseña: $REDIS_PASSWORD

JWT Secret Key:
  $SECRET_KEY

EOF

echo -e "${GREEN}✅ Credenciales guardadas en .env.credentials${NC}"
echo -e "${YELLOW}   (No subir este archivo a Git)${NC}"
echo ""

# ============================================
# PASO 5: Configurar email
# ============================================
echo -e "${BLUE}[5/5]${NC} ${YELLOW}Configurar email para Let's Encrypt${NC}"
echo ""
read -p "Ingresa tu email para certificados SSL: " USER_EMAIL

if [ -z "$USER_EMAIL" ]; then
    echo -e "${RED}❌ Email no proporcionado${NC}"
    echo "   Deberás editar manualmente deploy-to-vps.sh (línea 12)"
else
    # Actualizar email en deploy-to-vps.sh
    sed -i "s/EMAIL=\"tu@email.com\"/EMAIL=\"$USER_EMAIL\"/" deploy-to-vps.sh
    echo -e "${GREEN}✅ Email configurado: $USER_EMAIL${NC}"
fi

echo ""

# ============================================
# RESUMEN FINAL
# ============================================
echo "════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ PREPARACIÓN COMPLETADA${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "📋 ESTADO:"
echo ""
if [ "$DNS_OK" = "SI" ]; then
    echo -e "   DNS:      ${GREEN}✅ Configurado${NC}"
else
    echo -e "   DNS:      ${RED}❌ Pendiente${NC}"
fi
echo -e "   Secretos: ${GREEN}✅ Generados${NC}"
echo -e "   Archivos: ${GREEN}✅ Listos${NC}"

echo ""
echo "📁 ARCHIVOS CREADOS:"
echo "   ✅ .env.production       (variables de entorno)"
echo "   ✅ .env.credentials      (backup de credenciales)"
echo ""

echo "🚀 PRÓXIMOS PASOS:"
echo ""

if [ "$DNS_OK" = "NO" ]; then
    echo "   ${RED}1. URGENTE: Configurar DNS primero${NC}"
    echo "      Ir al panel del registrador de dominios"
    echo "      Configurar registros A (ver arriba)"
    echo "      Esperar propagación (5-30 minutos)"
    echo ""
    echo "   ${YELLOW}2. Verificar DNS:${NC}"
    echo "      dig +short $DOMAIN"
    echo ""
    echo "   ${YELLOW}3. Re-ejecutar este script para verificar${NC}"
    echo ""
else
    echo "   ${GREEN}1. Conectar al VPS:${NC}"
    echo "      ssh root@$VPS_IP"
    echo ""
    echo "   ${GREEN}2. Clonar o transferir el proyecto:${NC}"
    echo ""
    echo "      Opción A - Con Git:"
    echo "      git clone https://github.com/tuusuario/PuntoVenta.git"
    echo "      cd PuntoVenta"
    echo ""
    echo "      Opción B - Con rsync desde tu PC:"
    echo "      rsync -avz --exclude 'node_modules' \\"
    echo "        /home/jesus/Repos/PuntoVenta/ \\"
    echo "        root@$VPS_IP:/root/PuntoVenta/"
    echo ""
    echo "   ${GREEN}3. Copiar .env.production al VPS:${NC}"
    echo "      scp .env.production root@$VPS_IP:/root/PuntoVenta/"
    echo ""
    echo "   ${GREEN}4. En el VPS, ejecutar:${NC}"
    echo "      cd /root/PuntoVenta"
    echo "      chmod +x deploy-to-vps.sh"
    echo "      ./deploy-to-vps.sh"
    echo ""
fi

echo "📖 Ver guía completa en: PRE-DEPLOY-CHECKLIST.md"
echo ""

# Agregar .env.credentials al .gitignore
if ! grep -q ".env.credentials" .gitignore 2>/dev/null; then
    echo ".env.credentials" >> .gitignore
    echo -e "${GREEN}✅ .env.credentials agregado a .gitignore${NC}"
    echo ""
fi
