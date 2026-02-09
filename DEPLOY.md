# 🚀 Guía de Despliegue a Producción

## 📋 Pre-requisitos

- Docker instalado (v20.10+)
- Docker Compose instalado (v2.0+)
- Acceso SSH al servidor
- Puertos 80 y 443 disponibles

## 🔐 1. Configuración Inicial

### Crear archivo de variables de entorno

```bash
# Copiar plantilla
cp .env.production.example .env.production

# Editar con tus valores reales
nano .env.production
```

### Generar secretos seguros

```bash
# SECRET_KEY para JWT
openssl rand -hex 32

# REDIS_PASSWORD
openssl rand -hex 16
```

## 🐳 2. Despliegue

### Primera vez

```bash
# Construir imágenes
docker-compose -f docker-compose.prod.yml build

# Iniciar servicios
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Ejecutar migraciones

```bash
# Entrar al contenedor del backend
docker exec -it punto_venta_backend_prod bash

# Ejecutar migraciones de Alembic
alembic upgrade head

# Crear usuario admin (opcional)
python create_admin.py

# Salir
exit
```

## 🔄 3. Actualizar la Aplicación

```bash
# Detener servicios
docker-compose -f docker-compose.prod.yml down

# Actualizar código (git pull, etc.)
git pull origin main

# Reconstruir solo lo necesario
docker-compose -f docker-compose.prod.yml build

# Iniciar servicios
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Ejecutar migraciones si hay cambios en BD
docker exec -it punto_venta_backend_prod alembic upgrade head
```

## 🔍 4. Verificar Estado

```bash
# Ver estado de contenedores
docker ps

# Ver logs en tiempo real
docker-compose -f docker-compose.prod.yml logs -f

# Ver logs específicos
docker logs punto_venta_backend_prod
docker logs punto_venta_frontend_prod
docker logs punto_venta_db_prod
docker logs punto_venta_redis_prod

# Health checks
curl http://localhost/api/health
curl http://localhost/
```

## 🛡️ 5. Seguridad Adicional (Recomendado)

### Instalar SSL/TLS con Let's Encrypt

Editar `docker-compose.prod.yml` y agregar:

```yaml
services:
  certbot:
    image: certbot/certbot
    volumes:
      - ./data/certbot/conf:/etc/letsencrypt
      - ./data/certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

  frontend:
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./data/certbot/conf:/etc/letsencrypt
      - ./data/certbot/www:/var/www/certbot
```

### Configurar firewall

```bash
# Solo permitir HTTP/HTTPS y SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 🧹 6. Mantenimiento

### Backup de base de datos

```bash
# Backup manual
docker exec punto_venta_db_prod pg_dump -U puntoventauser puntoventa_prod > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup_20260208.sql | docker exec -i punto_venta_db_prod psql -U puntoventauser puntoventa_prod
```

### Limpiar recursos no usados

```bash
# Limpiar imágenes antiguas
docker image prune -a

# Limpiar volúmenes huérfanos
docker volume prune
```

## 🚨 7. Troubleshooting

### Backend no arranca

```bash
# Ver logs detallados
docker logs punto_venta_backend_prod --tail 100

# Verificar conectividad a DB
docker exec punto_venta_backend_prod pg_isready -h db -U puntoventauser

# Verificar conectividad a Redis
docker exec punto_venta_backend_prod redis-cli -h redis ping
```

### Frontend no carga

```bash
# Ver logs de nginx
docker logs punto_venta_frontend_prod

# Verificar que backend responde
docker exec punto_venta_frontend_prod wget -O- http://backend:8000/health
```

### Permisos de archivos subidos

```bash
# Si hay problemas con uploads
docker exec -u root punto_venta_backend_prod chown -R appuser:appuser /app/uploads
```

## 📊 8. Monitoreo (Opcional)

### Instalar Portainer

```bash
docker volume create portainer_data
docker run -d -p 9000:9000 \
  --name=portainer --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce
```

Acceder a: `http://tu-servidor:9000`

## ✅ Checklist Pre-Producción

- [ ] Variables de entorno configuradas con valores seguros
- [ ] SECRET_KEY generado de forma aleatoria
- [ ] REDIS_PASSWORD configurado
- [ ] Migraciones de BD ejecutadas
- [ ] Usuario admin creado
- [ ] Puertos 80/443 abiertos en firewall
- [ ] Backup automático configurado
- [ ] SSL/TLS configurado (Let's Encrypt)
- [ ] Monitoreo configurado
- [ ] Logs centralizados
- [ ] Documentación actualizada

## 🔗 Enlaces Útiles

- **Frontend**: http://tu-dominio.com
- **API Docs**: http://tu-dominio.com/api/docs
- **Portainer**: http://tu-dominio.com:9000

---

**Nota**: Adapta esta guía según tu infraestructura específica (AWS, DigitalOcean, VPS, etc.)
