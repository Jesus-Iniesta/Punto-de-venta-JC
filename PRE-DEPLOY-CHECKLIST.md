# ✅ CHECKLIST PRE-DESPLIEGUE A VPS
**IP VPS:** 77.37.63.94  
**Dominio:** flores-eternas-cyj.me

---

## 🎯 ESTADO ACTUAL

### ✅ Lo que YA está listo:
- [x] Dominio configurado en nginx.ssl.conf
- [x] IP del VPS conocida
- [x] docker-compose.prod.yml con SSL/Certbot
- [x] nginx.ssl.conf con HTTPS
- [x] Dockerfiles optimizados
- [x] Script de despliegue automatizado

### ⚠️ Lo que FALTA hacer:

#### 1. Configurar DNS (URGENTE)
Entra al panel de tu registrador de dominios y crea:

```
Tipo    Nombre    Valor           TTL
----    ------    -----           ---
A       @         77.37.63.94     3600
A       www       77.37.63.94     3600
```

**Verificar propagación:**
```bash
dig +short flores-eternas-cyj.me
# Debe devolver: 77.37.63.94
```

#### 2. Generar Secretos de Seguridad (CRÍTICO)

Edita `.env.production` y reemplaza estos valores:

```bash
# Generar SECRET_KEY (32 bytes hex)
openssl rand -hex 32

# Generar REDIS_PASSWORD (16 bytes hex)
openssl rand -hex 16

# Generar contraseñas seguras para PostgreSQL
```

**Edita el archivo:**
```bash
nano .env.production
```

Y reemplaza:
- `genera_un_string_aleatorio_largo_minimo_32_caracteres_aqui`
- `TuPassword_Seguro_2026_DB!`
- `TuPassword_Redis_Seguro_2026!`

#### 3. Configurar tu Email en el Script

Edita `deploy-to-vps.sh` línea 12:
```bash
nano deploy-to-vps.sh
# Cambiar: EMAIL="tu@email.com"
# Por: EMAIL="tuemailreal@ejemplo.com"
```

---

## 🚀 PASOS PARA DESPLEGAR

### En tu VPS (77.37.63.94):

#### 1. Conectar al VPS
```bash
ssh root@77.37.63.94
# O con usuario específico:
ssh usuario@77.37.63.94
```

#### 2. Instalar Docker (si no está instalado)
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt install docker-compose -y

# Verificar instalación
docker --version
docker-compose --version
```

#### 3. Configurar Firewall
```bash
# Permitir puertos necesarios
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

#### 4. Clonar o Transferir tu Proyecto
```bash
# Opción A: Clonar desde Git (recomendado)
git clone https://github.com/tuusuario/PuntoVenta.git
cd PuntoVenta

# Opción B: Transferir con rsync desde tu PC
# En tu PC local:
rsync -avz --exclude 'node_modules' --exclude '__pycache__' \
  /home/jesus/Repos/PuntoVenta/ \
  root@77.37.63.94:/root/PuntoVenta/
```

#### 5. Configurar Variables de Entorno
```bash
cd PuntoVenta

# Ya existe .env.production, pero verifica los valores
nano .env.production

# Genera los secretos:
openssl rand -hex 32  # Para SECRET_KEY
openssl rand -hex 16  # Para REDIS_PASSWORD
```

#### 6. Ejecutar Script de Despliegue
```bash
# Dar permisos
chmod +x deploy-to-vps.sh

# Ejecutar
./deploy-to-vps.sh
```

El script hará automáticamente:
- ✅ Verificar DNS
- ✅ Construir imágenes Docker
- ✅ Obtener certificado SSL
- ✅ Iniciar todos los servicios
- ✅ Ejecutar migraciones
- ✅ Configurar HTTPS

#### 7. Crear Usuario Admin
```bash
docker exec -it punto_venta_backend_prod python create_admin.py
```

---

## 🔍 VERIFICACIÓN POST-DESPLIEGUE

### 1. Ver estado de contenedores
```bash
docker ps
```

Debes ver:
- punto_venta_frontend_prod (up)
- punto_venta_backend_prod (up, healthy)
- punto_venta_db_prod (up, healthy)
- punto_venta_redis_prod (up, healthy)
- punto_venta_certbot (up)

### 2. Ver logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Probar endpoints
```bash
# Health check
curl https://flores-eternas-cyj.me/api/health

# Frontend
curl https://flores-eternas-cyj.me/

# API Docs
# Abrir en navegador: https://flores-eternas-cyj.me/api/docs
```

### 4. Verificar SSL
```bash
# Ver certificado
openssl s_client -connect flores-eternas-cyj.me:443 -servername flores-eternas-cyj.me

# O visitar: https://www.ssllabs.com/ssltest/analyze.html?d=flores-eternas-cyj.me
```

---

## 🛠️ COMANDOS ÚTILES

```bash
# Ver logs en tiempo real
docker-compose -f docker-compose.prod.yml logs -f

# Ver logs de un servicio específico
docker logs punto_venta_backend_prod -f

# Reiniciar servicios
docker-compose -f docker-compose.prod.yml restart

# Detener todo
docker-compose -f docker-compose.prod.yml down

# Iniciar todo
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Ejecutar migraciones
docker exec -it punto_venta_backend_prod alembic upgrade head

# Backup de base de datos
docker exec punto_venta_db_prod pg_dump -U puntoventauser puntoventa_prod > backup_$(date +%Y%m%d).sql

# Entrar al backend
docker exec -it punto_venta_backend_prod bash

# Ver uso de recursos
docker stats
```

---

## 🚨 TROUBLESHOOTING

### DNS no resuelve
```bash
# Verificar DNS
dig +short flores-eternas-cyj.me
nslookup flores-eternas-cyj.me

# Si no resuelve, esperar 5-30 minutos más
```

### Certificado SSL falla
```bash
# Ver logs de certbot
docker logs punto_venta_certbot

# Intentar obtener certificado manualmente
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  --email tumail@ejemplo.com \
  -d flores-eternas-cyj.me -d www.flores-eternas-cyj.me
```

### Backend no responde
```bash
# Ver logs
docker logs punto_venta_backend_prod --tail 100

# Verificar conexión a DB
docker exec punto_venta_backend_prod pg_isready -h db -U puntoventauser

# Verificar Redis
docker exec punto_venta_redis_prod redis-cli -a TuPassword ping
```

---

## 📊 RESUMEN EJECUTIVO

### ⏱️ Tiempo estimado: 30-45 minutos

1. **Configurar DNS** → 5 minutos (+ espera propagación 5-30 min)
2. **Generar secretos** → 2 minutos
3. **Conectar a VPS** → 3 minutos
4. **Instalar Docker** → 5 minutos (si no está)
5. **Transferir proyecto** → 5 minutos
6. **Ejecutar deploy-to-vps.sh** → 15 minutos
7. **Verificar y probar** → 5 minutos

### 🎯 Resultado final:
✅ **https://flores-eternas-cyj.me** - Funcionando con SSL  
✅ Certificado SSL con renovación automática  
✅ Todos los servicios healthy  
✅ Base de datos migrada  
✅ Listo para usar en producción  

---

**💡 Consejo:** Después del despliegue, configura un respaldo automático diario de la base de datos.
