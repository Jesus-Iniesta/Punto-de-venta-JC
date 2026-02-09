# 🌐 Guía de Configuración de Dominio Personalizado

## 📋 Pre-requisitos

- Dominio registrado (ej: tudominio.com)
- Acceso al panel DNS del registrador
- Servidor/VPS con IP pública
- Docker y Docker Compose instalados

---

## 🔧 Paso 1: Configurar DNS

En el panel de tu registrador de dominios (GoDaddy, Namecheap, Cloudflare, etc.), crea los siguientes registros:

```
Tipo    Nombre    Valor              TTL
----    ------    -----              ---
A       @         TU_IP_SERVIDOR     3600
A       www       TU_IP_SERVIDOR     3600
```

**Ejemplo:**
- Si tu servidor está en `123.45.67.89`
- Y tu dominio es `ventasapp.com`

```
A       @         123.45.67.89       3600
A       www       123.45.67.89       3600
```

⏳ **Nota:** La propagación DNS puede tomar 5 minutos a 48 horas.

Verifica con:
```bash
# Linux/Mac
dig tudominio.com
nslookup tudominio.com

# O en línea: https://dnschecker.org
```

---

## 🔐 Opción A: HTTP Simple (Sin SSL)

### 1. Editar nginx.conf

Abre `frontend/nginx.conf` y cambia la línea 3:

```nginx
# Cambiar de:
server_name localhost;

# A:
server_name tudominio.com www.tudominio.com;
```

### 2. Reconstruir y desplegar

```bash
# Detener servicios
docker-compose -f docker-compose.prod.yml down

# Reconstruir frontend
docker-compose -f docker-compose.prod.yml build frontend

# Iniciar
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Verificar
curl http://tudominio.com/api/health
```

**✅ Listo!** Tu aplicación estará en `http://tudominio.com`

⚠️ **Advertencia:** HTTP no es seguro para producción. Se recomienda usar HTTPS.

---

## 🔒 Opción B: HTTPS con Let's Encrypt (Recomendado)

### 1. Preparar archivos SSL

```bash
# Crear directorios para Let's Encrypt
mkdir -p data/certbot/conf
mkdir -p data/certbot/www
```

### 2. Actualizar docker-compose.prod.yml

Agrega el servicio Certbot:

```yaml
services:
  # ... servicios existentes ...

  # Agregar Certbot
  certbot:
    image: certbot/certbot
    container_name: punto_venta_certbot
    volumes:
      - ./data/certbot/conf:/etc/letsencrypt
      - ./data/certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    depends_on:
      - frontend

  frontend:
    # ... configuración existente ...
    ports:
      - "80:80"
      - "443:443"  # Agregar puerto HTTPS
    volumes:
      - ./data/certbot/conf:/etc/letsencrypt      # Agregar
      - ./data/certbot/www:/var/www/certbot       # Agregar
```

### 3. Usar configuración nginx con SSL

```bash
# Hacer backup del nginx.conf actual
cp frontend/nginx.conf frontend/nginx.conf.backup

# Copiar la configuración SSL
cp frontend/nginx.ssl.conf frontend/nginx.conf

# Editar y reemplazar "tudominio.com" con tu dominio real
nano frontend/nginx.conf
```

### 4. Obtener certificado inicial

```bash
# Primero, inicia solo con HTTP para validación
docker-compose -f docker-compose.prod.yml up -d frontend

# Obtener certificado
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email tu@email.com \
  --agree-tos \
  --no-eff-email \
  -d tudominio.com \
  -d www.tudominio.com
```

### 5. Reconstruir con SSL

```bash
# Detener servicios
docker-compose -f docker-compose.prod.yml down

# Reconstruir frontend con nueva configuración
docker-compose -f docker-compose.prod.yml build frontend

# Iniciar todos los servicios
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Verificar
curl https://tudominio.com/api/health
```

**✅ Listo!** Tu aplicación estará en `https://tudominio.com` 🔒

---

## 🔄 Script Automático de SSL

Crea un archivo `setup-ssl.sh`:

```bash
#!/bin/bash

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Uso: ./setup-ssl.sh tudominio.com tu@email.com"
    exit 1
fi

echo "🔐 Configurando SSL para $DOMAIN..."

# Crear directorios
mkdir -p data/certbot/conf data/certbot/www

# Iniciar frontend temporalmente
docker-compose -f docker-compose.prod.yml up -d frontend

# Esperar que nginx esté listo
sleep 10

# Obtener certificado
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d $DOMAIN \
  -d www.$DOMAIN

# Reemplazar dominio en nginx.conf
sed -i "s/tudominio.com/$DOMAIN/g" frontend/nginx.conf

# Reconstruir
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build frontend
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

echo "✅ SSL configurado para https://$DOMAIN"
```

Usar:
```bash
chmod +x setup-ssl.sh
./setup-ssl.sh tudominio.com tu@email.com
```

---

## 🌍 Configuración con Cloudflare (Alternativa)

Si usas Cloudflare como proxy (recomendado para DDoS protection):

### 1. Configurar DNS en Cloudflare
- Tipo: A
- Nombre: @
- Contenido: IP_SERVIDOR
- Proxy: ✅ Activado (nube naranja)

### 2. En nginx.conf, mantener:
```nginx
server_name tudominio.com www.tudominio.com;
```

### 3. NO necesitas Let's Encrypt
Cloudflare proporciona SSL automático (Flexible o Full)

### 4. Configurar Cloudflare SSL:
- Dashboard → SSL/TLS → Modo: **Full (strict)**
- Dashboard → SSL/TLS → Edge Certificates → Always Use HTTPS: **ON**

---

## 🧪 Verificación

```bash
# Verificar DNS
dig +short tudominio.com

# Verificar HTTP
curl -I http://tudominio.com

# Verificar HTTPS
curl -I https://tudominio.com

# Verificar API
curl https://tudominio.com/api/health

# Ver certificado SSL
openssl s_client -connect tudominio.com:443 -servername tudominio.com
```

---

## 🛠️ Troubleshooting

### Error: "404 Not Found" en dominio

**Causa:** DNS no propagado o nginx mal configurado

**Solución:**
```bash
# Verificar DNS
nslookup tudominio.com

# Ver logs de nginx
docker logs punto_venta_frontend_prod

# Verificar configuración
docker exec punto_venta_frontend_prod nginx -t
```

### Error: "NET::ERR_CERT_AUTHORITY_INVALID"

**Causa:** Certificado SSL no válido o no instalado

**Solución:**
```bash
# Verificar certificados
docker exec punto_venta_frontend_prod ls -la /etc/letsencrypt/live/

# Reinstalar certificado
docker-compose -f docker-compose.prod.yml run --rm certbot certonly --force-renewal \
  --webroot --webroot-path=/var/www/certbot \
  --email tu@email.com -d tudominio.com -d www.tudominio.com
```

### Error: CORS en API

**Causa:** Backend no permite el dominio

**Solución:** Configurar CORS en `backend/main.py`:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tudominio.com", "https://www.tudominio.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📊 Checklist de Dominio Personalizado

- [ ] Dominio registrado
- [ ] Registros DNS configurados (A records)
- [ ] DNS propagado (verificar con dig/nslookup)
- [ ] `nginx.conf` actualizado con dominio
- [ ] SSL/TLS configurado (Let's Encrypt o Cloudflare)
- [ ] Puertos 80 y 443 abiertos en firewall
- [ ] Certificado SSL verificado
- [ ] HTTP redirige a HTTPS
- [ ] API accesible en https://tudominio.com/api
- [ ] CORS configurado en backend

---

## 🔗 Recursos Útiles

- **Verificar DNS:** https://dnschecker.org
- **Probar SSL:** https://www.ssllabs.com/ssltest/
- **Let's Encrypt Docs:** https://letsencrypt.org/getting-started/
- **Cloudflare DNS:** https://dash.cloudflare.com

---

**💡 Consejo:** Empieza con HTTP simple para verificar que el dominio funciona, luego agrega SSL.
