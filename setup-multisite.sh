#!/bin/bash

# ============================================
# Selector de Configuración para Múltiples Sitios
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "════════════════════════════════════════════════════════════"
echo "  🌐 Configuración para Múltiples Sitios - Flores Eternas"
echo "════════════════════════════════════════════════════════════"
echo ""

echo -e "${YELLOW}Detectamos que tienes otros sitios con nginx en tu VPS.${NC}"
echo ""
echo "Solo un servicio puede usar los puertos 80 y 443 a la vez."
echo ""
echo "Elige cómo quieres configurar este proyecto:"
echo ""

echo -e "${BLUE}[A]${NC} Nginx Reverse Proxy en el host ${GREEN}(RECOMENDADO)${NC}"
echo "    • Múltiples sitios sin conflictos"
echo "    • Este sitio usa puertos 8080/8443 internamente"
echo "    • Nginx en el host redirige según dominio"
echo "    • Configuración profesional"
echo ""

echo -e "${BLUE}[B]${NC} Usar puertos diferentes (8080/8443)"
echo "    • Más simple pero menos profesional"
echo "    • Acceso: https://flores-eternas-cyj.me:8443"
echo "    • URLs incluyen el puerto"
echo ""

echo -e "${BLUE}[C]${NC} Este sitio en 80/443 (detener otros nginx)"
echo "    • Requiere detener otros servicios nginx"
echo "    • Solo este sitio en 80/443"
echo ""

read -p "¿Qué opción prefieres? [A/B/C]: " OPCION

OPCION=$(echo "$OPCION" | tr '[:lower:]' '[:upper:]')

case $OPCION in
    A)
        echo ""
        echo -e "${GREEN}✅ Opción A: Nginx Reverse Proxy${NC}"
        echo ""
        echo "Pasos a seguir:"
        echo ""
        echo "1. Usar docker-compose-multisite.prod.yml (puertos 8080/8443)"
        echo "2. Configurar nginx reverse proxy en el host"
        echo "3. Obtener certificado SSL desde el host"
        echo ""
        
        # Copiar archivo multisite
        cp docker-compose-multisite.prod.yml docker-compose.prod.yml
        echo -e "${GREEN}✅ docker-compose.prod.yml actualizado (puertos 8080/8443)${NC}"
        echo ""
        
        echo "📋 INSTRUCCIONES COMPLETAS:"
        echo ""
        echo "En tu VPS, ejecuta estos comandos:"
        echo ""
        echo "# 1. Instalar nginx en el host (si no lo tienes)"
        echo "sudo apt install nginx certbot python3-certbot-nginx -y"
        echo ""
        echo "# 2. Copiar configuración de reverse proxy"
        echo "sudo nano /etc/nginx/sites-available/flores-eternas"
        echo "# (Copiar contenido de: nginx-reverse-proxy.conf)"
        echo ""
        echo "# 3. Activar sitio"
        echo "sudo ln -s /etc/nginx/sites-available/flores-eternas /etc/nginx/sites-enabled/"
        echo "sudo nginx -t"
        echo "sudo systemctl reload nginx"
        echo ""
        echo "# 4. Obtener certificado SSL"
        echo "sudo certbot --nginx -d flores-eternas-cyj.me -d www.flores-eternas-cyj.me"
        echo ""
        echo "# 5. Iniciar contenedores Docker"
        echo "docker-compose -f docker-compose.prod.yml --env-file .env.production up -d"
        echo ""
        echo "📖 Ver guía completa: MULTIPLE-SITES-CONFIG.md"
        ;;
        
    B)
        echo ""
        echo -e "${GREEN}✅ Opción B: Puertos Diferentes${NC}"
        echo ""
        
        # Usar archivo multisite
        cp docker-compose-multisite.prod.yml docker-compose.prod.yml
        echo -e "${GREEN}✅ docker-compose.prod.yml actualizado (puertos 8080/8443)${NC}"
        echo ""
        
        echo "Tu sitio estará accesible en:"
        echo "  • HTTP:  http://flores-eternas-cyj.me:8080"
        echo "  • HTTPS: https://flores-eternas-cyj.me:8443"
        echo ""
        echo "Para desplegar:"
        echo "  docker-compose -f docker-compose.prod.yml --env-file .env.production up -d"
        echo ""
        echo "⚠️  Nota: Los usuarios deberán incluir el puerto en la URL"
        ;;
        
    C)
        echo ""
        echo -e "${YELLOW}⚠️  Opción C: Este sitio en 80/443${NC}"
        echo ""
        echo "Debes detener los otros servicios nginx primero:"
        echo ""
        echo "# Ver contenedores nginx activos"
        echo "docker ps | grep nginx"
        echo ""
        echo "# Detener contenedores"
        echo "docker stop nombre_del_contenedor"
        echo ""
        echo "# O detener nginx del sistema"
        echo "sudo systemctl stop nginx"
        echo ""
        echo "Después, usa el docker-compose.prod.yml original (puertos 80/443)"
        echo ""
        echo "Para desplegar:"
        echo "  ./deploy-to-vps.sh"
        ;;
        
    *)
        echo ""
        echo -e "${RED}❌ Opción no válida${NC}"
        echo "Ejecuta el script nuevamente y elige A, B o C"
        exit 1
        ;;
esac

echo ""
echo "════════════════════════════════════════════════════════════"
echo -e "${GREEN}Configuración completada!${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""
