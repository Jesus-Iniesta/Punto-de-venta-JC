FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Crear usuario no-root para seguridad
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copiar requirements primero (mejor cache de capas)
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código de la aplicación
COPY . .

# Crear directorio de uploads y dar permisos
RUN mkdir -p /app/uploads && chown -R appuser:appuser /app

# Cambiar al usuario no-root
USER appuser

# Exponer el puerto
EXPOSE 8000

# Health check (usando wget con GET request)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 -qO- http://localhost:8000/health > /dev/null || exit 1

# Comando para ejecutar la aplicación en PRODUCCIÓN (sin --reload)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
