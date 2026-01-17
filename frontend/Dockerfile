FROM node:20-alpine

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar archivos de configuración
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar el código de la aplicación
COPY . .

# Exponer el puerto
EXPOSE 5173

# Comando para ejecutar la aplicación en modo desarrollo
CMD ["pnpm", "run", "dev", "--host"]
