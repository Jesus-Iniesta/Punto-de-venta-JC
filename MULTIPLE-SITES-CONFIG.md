# 🌐 Configuración para Múltiples Sitios en el Mismo VPS

## 🚨 PROBLEMA DETECTADO

Tienes **otros nginx corriendo** en tu VPS. Solo **un servicio** puede usar los puertos **80** y **443** a la vez.

**Estado actual:**
- Tu VPS: `77.37.63.94`
- Otros sitios: Ya usando nginx
- Este proyecto: Necesita puertos 80 y 443

---

## ✅ SOLUCIÓN: 3 Opciones

### 🎯 **Opción A: Nginx Reverse Proxy en el Host** (RECOMENDADO)

**Mejor para:** Múltiples sitios en producción

#### Cómo funciona:
- Un **nginx principal** en el host escucha en 80/443
- Redirige tráfico según el dominio a distintos contenedores
- Todos los sitios comparten los mismos puertos
- Configuración profesional

#### Configuración:

1. **Modificar docker-compose.prod.yml:**

```yaml
  frontend:
    # ... configuración existente ...
    ports:
      - "8080:80"    # ⬅️ Cambiar de 80 a 8080
      - "8443:443"   # ⬅️ Cambiar de 443 a 8443
```

2. **Crear nginx reverse proxy en el host:**

```nginx
# /etc/nginx/sites-available/flores-eternas

upstream flores_eternas_backend {
    server localhost:8080;
}

upstream flores_eternas_backend_ssl {
    server localhost:8443;
}

# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name flores-eternas-cyj.me www.flores-eternas-cyj.me;
    return 301 https://$host$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name flores-eternas-cyj.me www.flores-eternas-cyj.me;

    # Certificados SSL (Let's Encrypt desde el host)
    ssl_certificate /etc/letsencrypt/live/flores-eternas-cyj.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/flores-eternas-cyj.me/privkey.pem;

    # Proxy a tu contenedor
    location / {
        proxy_pass http://flores_eternas_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. **Activar y reiniciar:**

```bash
# En el VPS
sudo ln -s /etc/nginx/sites-available/flores-eternas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Obtener certificado SSL para el dominio
sudo certbot --nginx -d flores-eternas-cyj.me -d www.flores-eternas-cyj.me
```

**✅ Ventajas:**
- Múltiples sitios sin conflictos
- SSL centralizado
- Más fácil de mantener
- Configuración profesional

**❌ Desventajas:**
- Requiere nginx en el host
- Un poco más de configuración inicial

---

### 🔧 **Opción B: Usar Puertos Diferentes** (MÁS SIMPLE)

**Mejor para:** Desarrollo o sitios internos

#### Configuración:

Edita `docker-compose.prod.yml`:

```yaml
  frontend:
    # ... configuración existente ...
    ports:
      - "8080:80"    # ⬅️ Acceso HTTP en puerto 8080
      - "8443:443"   # ⬅️ Acceso HTTPS en puerto 8443
```

**Acceso:**
- HTTP: `http://flores-eternas-cyj.me:8080`
- HTTPS: `https://flores-eternas-cyj.me:8443`

**Configurar DNS:**
```
A    flores-eternas    77.37.63.94
```

**✅ Ventajas:**
- Muy simple
- No requiere nginx en host
- Cada contenedor independiente

**❌ Desventajas:**
- URLs con puertos (menos profesional)
- Usuarios deben recordar el puerto
- SSL complicado (certificados con puertos personalizados)

---

### ⚡ **Opción C: Este Sitio como Único en 80/443**

**Mejor para:** Si este es tu sitio principal

#### Pasos:

1. **Detener otros servicios nginx:**

```bash
# En el VPS
docker ps | grep nginx  # Ver qué contenedores hay
docker stop nombre_del_contenedor_nginx

# O si es nginx del sistema
sudo systemctl stop nginx
```

2. **Usar configuración actual (sin cambios)**

```yaml
  frontend:
    ports:
      - "80:80"
      - "443:443"
```

3. **Mover otros sitios a puertos diferentes**

**✅ Ventajas:**
- Este sitio queda "limpio" en 80/443
- Sin configuraciones extra

**❌ Desventajas:**
- Otros sitios necesitan puertos diferentes
- Solo un sitio puede estar en 80/443

---

## 🎯 RECOMENDACIÓN

### Para tu caso (múltiples sitios):

**Usar Opción A: Nginx Reverse Proxy**

1. Configurar nginx en el host como proxy
2. Cada sitio usa puertos internos (8080, 8081, 8082, etc.)
3. El proxy redirige según el dominio
4. SSL/HTTPS centralizado en el proxy

### Estructura ideal:

```
VPS (77.37.63.94)
├── Nginx Host (puertos 80, 443) ← PUNTO DE ENTRADA
│   ├── sitio1.com → localhost:8080 (flores-eternas)
│   ├── sitio2.com → localhost:8081 (otro sitio)
│   └── sitio3.com → localhost:8082 (otro sitio)
└── Contenedores Docker
    ├── flores_eternas_frontend (puerto 8080)
    ├── otro_sitio_frontend (puerto 8081)  
    └── otro_sitio_frontend (puerto 8082)
```

---

## 📁 ARCHIVOS PARA OPCIÓN A

He creado archivos de configuración para ti:

### 1. docker-compose.prod.yml (con puertos 8080/8443)

Usa: `docker-compose-multisite.prod.yml`

### 2. Configuración nginx para el host

Usa: `nginx-reverse-proxy.conf`

---

## 🚀 PASOS RÁPIDOS (Opción A)

```bash
# 1. En tu VPS, instalar nginx en el host (si no lo tienes)
sudo apt install nginx -y

# 2. Copiar configuración de reverse proxy
sudo nano /etc/nginx/sites-available/flores-eternas
# Pegar contenido de nginx-reverse-proxy.conf

# 3. Activar sitio
sudo ln -s /etc/nginx/sites-available/flores-eternas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 4. Obtener certificado SSL
sudo certbot --nginx -d flores-eternas-cyj.me -d www.flores-eternas-cyj.me

# 5. Usar docker-compose con puertos 8080/8443
docker-compose -f docker-compose-multisite.prod.yml up -d
```

---

## ❓ ¿Qué opción elegir?

**¿Tienes otros sitios en producción?** → **Opción A** (Reverse Proxy)

**¿Es para pruebas o desarrollo?** → **Opción B** (Puertos diferentes)

**¿Este es tu único sitio importante?** → **Opción C** (80/443 directo)

---

**💡 Consejo:** Si planeas tener más de 2 sitios, definitivamente usa Opción A desde el inicio.
