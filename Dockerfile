# Imagen base oficial y liviana de Node.js LTS sobre Alpine Linux
FROM node:20-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiar manifiestos de dependencias primero para aprovechar la caché de capas de Docker
COPY package*.json ./

# Instalar únicamente dependencias de producción de forma determinística
RUN npm ci --omit=dev && npm cache clean --force

# Copiar el código fuente de la aplicación (excluyendo lo listado en .dockerignore)
COPY src ./src

# Crear directorios necesarios para logs y almacenamiento temporal de uploads con permisos para el usuario node
RUN mkdir -p logs uploads/users/documents uploads/users/licenses uploads/deliveries/proofs \
    && chown -R node:node /usr/src/app

# Variables de entorno por defecto (pueden sobreescribirse al ejecutar docker run con --env-file o -e)
ENV NODE_ENV=production
ENV PORT=3000

# Ejecutar el contenedor con usuario sin privilegios de root por seguridad
USER node

# Exponer el puerto de la aplicación
EXPOSE 3000

# Healthcheck nativo del contenedor consultando el endpoint /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Comando de inicio del servidor
CMD ["npm", "start"]
