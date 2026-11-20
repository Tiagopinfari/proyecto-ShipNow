# ShipNow API — Backend 3 (Coderhouse)

API RESTful profesional de logística para **ShipNow**, desarrollada bajo arquitectura en 3 capas (**Controller — Service — Repository**), validación estricta de variables de entorno al arranque, módulo de mocking con Faker, capa centralizada de manejo de errores, sistema profesional de logging con Winston, documentación interactiva con Swagger / OpenAPI 3.0, suite de testing funcional con Mocha, Chai y Supertest, carga de archivos con `multer.diskStorage`, y **optimización de performance, preparación para producción y contenerización con Docker** (Pre-entrega Módulo 8).

---

## 🏛️ Arquitectura del Sistema

El sistema implementa el patrón de capas desacopladas asegurando alta cohesión, testeabilidad (separando `src/app.js` de `src/server.js`), paginación y filtrado en repositorios, operaciones asíncronas no bloqueantes en el Event Loop, y protección de endpoints internos en producción:

```text
[ Cliente HTTP / Navegador / Supertest / Contenedor Docker ]
       │
       ├───► GET /api/health    ──► [ Health Check Seguro ] (status, environment, uptime, timestamp)
       ├───► GET /api/docs      ──► [ Swagger UI ] (protegido en prod por swaggerProdGuard)
       │
       ▼
  [ src/app.js ]           ──► Instancia Express con límite de payload (100kb)
       │
       ▼
 [ httpLogger Middleware ] ──► Registra peticiones HTTP con Winston (método, URL, status, duración)
       │
       ▼
 [ Router ]                ──► Enrutamiento declarativo limpio (src/routes/*.js)
       │
       ├───► [ internalEndpointGuard ] ──► Protege /api/mocks y /api/loggerTest en producción
       ├───► [ Multer diskStorage ]    ──► Almacenamiento en disco asíncrono (src/config/multer.config.js)
       │
       ▼
[ Controller ]             ──► Manejo de req/res. Delega errores en next(error).
       │
       ▼
 [ Service ]               ──► Reglas de negocio, paginación (parsePaginationParams) y validaciones.
       │
       ▼
[ Repository ]             ──► Consultas acotadas con .find(filter).sort().skip().limit().
       │
       ▼
  [ Model ]                ──► Esquemas de datos Mongoose con validaciones nativas.
```

---

## ⚡ Performance, Escalabilidad, Producción y Docker (Pre-entrega Módulo 8)

### 1. Buenas Prácticas de Performance y Escalabilidad

- **Paginación, Límites y Filtros en Listados:**
  Ningún endpoint devuelve la colección completa sin control. Todos los listados (`GET /api/users`, `GET /api/orders`, `GET /api/deliveries`, `GET /api/products`) implementan paginación mediante [`src/utils/pagination.js`](src/utils/pagination.js) (`page=1`, `limit=20` por defecto, tope máximo `MAX_LIMIT = 100`) y filtros por campos indexables:
  - `GET /api/users?page=1&limit=20&role=driver&email=...`
  - `GET /api/orders?page=1&limit=20&status=in_transit&priority=high&customer=...`
  - `GET /api/deliveries?page=1&limit=20&status=assigned&priority=normal&driver=...&order=...`
  - `GET /api/products?page=1&limit=20&category=perifericos&all=true`
- **Control de Payloads y Event Loop No Bloqueante:**
  - Los parsers `express.json({ limit: '100kb' })` y `express.urlencoded({ limit: '100kb' })` limitan el tamaño de los cuerpos JSON para prevenir saturación de memoria.
  - La gestión de archivos con Multer en [`src/config/multer.config.js`](src/config/multer.config.js) utiliza **`multer.diskStorage`** nativo combinado con operaciones asíncronas (`fs.promises.mkdir`, `fs.promises.rename`, `fs.promises.unlink`) para no bloquear el Event Loop de Node.js en tiempo de ejecución.

---

### 2. Preparación para Producción y Variables de Entorno

La aplicación no contiene valores sensibles ni secretos harcodeados en el código. Al iniciar, [`src/config/env.config.js`](src/config/env.config.js) ejecuta `validateEnvVariables()` y **aborta inmediatamente el arranque con un mensaje de error claro si falta cualquiera de las variables críticas**.

#### Variables de Entorno Requeridas (`.env.example`)

| Variable | Obligatoria | Descripción | Ejemplo |
| :--- | :---: | :--- | :--- |
| **`PORT`** | Sí | Puerto HTTP en el que escucha el servidor (y expone Docker). | `3000` |
| **`NODE_ENV`** | Sí | Entorno de ejecución (`development`, `test`, `production`). | `development` |
| **`MONGODB_URI`** | Sí | URI de conexión a MongoDB para desarrollo o producción. | `mongodb://127.0.0.1:27017/shipnow` |
| **`MONGODB_TEST_URI`**| En test | URI de base de datos separada exclusiva para testing. | `mongodb://127.0.0.1:27017/shipnow_test` |
| **`JWT_SECRET`** | Sí | Clave secreta para firma y seguridad de tokens. | `tu_clave_secreta_jwt` |
| **`SHIPPING_API_KEY`**| Sí | API Key del servicio de cotización logística. | `tu_shipping_api_key` |
| **`EXTERNAL_SHIPPING_API_URL`** | No | URL del servicio externo de tarifas de envío. | `https://api.shipping.shipnow.internal/v1/rates` |
| **`LOG_LEVEL`** | No | Nivel máximo de logs en consola (`debug` en dev, `info` en prod). | `debug` |
| **`ENABLE_SWAGGER_IN_PROD`** | No | Habilita (`true`) o restringe (`false`) Swagger UI en producción. | `false` |
| **`ENABLE_INTERNAL_ENDPOINTS_IN_PROD`** | No | Habilita (`true`) o restringe (`false`) Mocks y LoggerTest en producción. | `false` |

#### 🩺 Health Check Seguro (`GET /api/health` y `GET /health`)
Devuelve exclusivamente información operativa segura sin exponer secretos, claves ni URIs:
```json
{
  "status": "ok",
  "environment": "production",
  "uptime": 128.45,
  "timestamp": "2026-11-20T18:30:00.000Z"
}
```

#### 🔒 Criterio Aplicado sobre Endpoints Internos en Producción (`/api/mocks`, `/api/loggerTest` y `/api/docs`)
Mediante el middleware [`src/middlewares/internalEndpointGuard.js`](src/middlewares/internalEndpointGuard.js) se aplicó una política de **seguridad por defecto (Secure by Default)**:
1. **En `development` y `test`:** Todos los endpoints internos (`/api/mocks/*`, `/api/loggerTest`, `/api/docs`) están **100% activos** para facilitar el desarrollo, las pruebas automatizadas y la revisión interactiva.
2. **En `production` (`NODE_ENV=production`):**
   - **`/api/mocks` y `/api/loggerTest`:** Quedan **bloqueados automáticamente** respondiendo `403 Forbidden` (`FORBIDDEN_OPERATION`), para impedir que un tercero inserte datos falsos (`/seed`) o inunde los archivos de logs en producción. Solo se habilitan si el administrador define explícitamente `ENABLE_INTERNAL_ENDPOINTS_IN_PROD=true`.
   - **Swagger UI (`/api/docs` y `/api/docs.json`):** Queda **restringido por defecto en producción** (`403 FORBIDDEN_OPERATION`) para no exponer la topología interna de la API públicamente, pero puede habilitarse de forma controlada en entornos de staging/demo pasando la variable `ENABLE_SWAGGER_IN_PROD=true` al contenedor Docker.

---

### 3. Contenerización con Docker (`Dockerfile` y `.dockerignore`)

El proyecto incluye un [`Dockerfile`](Dockerfile) optimizado basado en `node:20-alpine` que:
- Instala únicamente dependencias de producción con `npm ci --omit=dev`.
- Se ejecuta bajo el usuario sin privilegios `USER node`.
- Expone el puerto **`3000`** (`EXPOSE 3000`).
- Incluye un `HEALTHCHECK` nativo que monitorea `http://localhost:3000/api/health`.

#### 🚫 Archivos Excluidos del Repositorio y de la Imagen Docker (`.gitignore` y `.dockerignore`)
Nunca deben subirse al repositorio ni copiarse dentro de la imagen Docker:
- `node_modules/`
- Archivos de entorno con credenciales (`.env`, `.env.test`, `.env.*`)
- Historial de Git (`.git/`)
- Archivos de registro generados por Winston (`logs/*.log`)
- Archivos subidos por usuarios con Multer (`uploads/*`)
- Reportes de coverage, carpetas de tests y archivos temporales (`coverage/`, `test/`, `*.tmp`)

> **Aclaración sobre `logs/` y `uploads/` en Producción / Docker:** Los archivos subidos a `uploads/` y los registros en `logs/` dentro de un contenedor son efímeros por diseño. En un despliegue productivo real deben montarse como volúmenes externos de Docker (`-v`) o delegarse a almacenamiento de objetos (S3 / Cloud Storage) y colectores de logs, nunca utilizarse como almacenamiento permanente dentro de la capa del contenedor ni subirse a GitHub.

#### 🐳 Cómo Construir la Imagen y Ejecutar el Contenedor Docker

1. **Construir la imagen Docker:**
   ```bash
   docker build -t shipnow-api:1.0 .
   ```

2. **Ejecutar el contenedor pasando tu archivo `.env`:**
   *(Para poder probar Swagger y Mocks dentro del contenedor aunque corra en modo producción, podés pasar los flags `ENABLE_SWAGGER_IN_PROD=true` y `ENABLE_INTERNAL_ENDPOINTS_IN_PROD=true`)*:
   ```bash
   docker run -d \
     --name shipnow-container \
     -p 3000:3000 \
     --env-file .env \
     -e ENABLE_SWAGGER_IN_PROD=true \
     -e ENABLE_INTERNAL_ENDPOINTS_IN_PROD=true \
     shipnow-api:1.0
   ```

3. **Probar el contenedor en ejecución:**
   - **Health Check:** [http://localhost:3000/api/health](http://localhost:3000/api/health)
   - **Swagger UI:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
   - **Endpoint principal (Usuarios paginados):** [http://localhost:3000/api/users?page=1&limit=10](http://localhost:3000/api/users?page=1&limit=10)

4. **Ver logs o detener el contenedor:**
   ```bash
   docker logs -f shipnow-container
   docker stop shipnow-container && docker rm shipnow-container
   ```

---

## 📂 Carga de Archivos, Documentos y Comprobantes con Multer (Pre-entrega Módulo 7)

Configurado centralizadamente en [`src/config/multer.config.js`](src/config/multer.config.js) utilizando **`multer.diskStorage`**:
- **Subcarpetas por tipo de documento:**
  - `uploads/users/documents/` (`user_document`)
  - `uploads/users/licenses/` (`driver_license`)
  - `uploads/deliveries/proofs/` (`delivery_proof`)
- **Límites y Validaciones:** Máximo **5 MB**, formatos permitidos `PDF`, `JPG`, `JPEG`, `PNG`, `WEBP`. Si la entidad destino no existe o el `documentType` es inválido, el archivo se limpia de forma asíncrona con `removeUploadedFileAsync()`.
- **Endpoints `multipart/form-data` (campo `file`):**
  - `POST /api/users/:id/documents`
  - `POST /api/deliveries/:id/proof`
  - `POST /api/orders/:id/proof`

---

## 🧪 Testing Funcional Automatizado (Pre-entrega Módulo 6, 7 y 8)

El proyecto cuenta con **59 tests funcionales automatizados** con **Mocha**, **Chai** y **Supertest**:

```bash
npm test
```

### Suites Cubiertas en `/test` (`59 passing`)
1. **`test/users.test.js`:** ABM completo de usuarios y validación de errores de dominio.
2. **`test/orders.test.js`:** Creación con cálculo de envío, consulta, actualización de estados y errores.
3. **`test/deliveries.test.js`:** Asignación de repartidores, cambio de estado y errores.
4. **`test/mocks.test.js`:** Generación en memoria (`/users`, `/mockingUsers`, `/orders`) y `POST /seed`.
5. **`test/uploads.test.js`:** Subida de documentos PDF y comprobantes PNG/JPG con `multer.diskStorage`, verificación en disco, metadatos en DB y errores (`FILE_REQUIRED`, `INVALID_FILE_TYPE`, `FILE_TOO_LARGE`, `INVALID_DOCUMENT_TYPE`).
6. **`test/system.test.js`:** Validación de `/api/loggerTest`, `/loggerTest`, `/api/docs/`, `/api/docs.json` y `404 ROUTE_NOT_FOUND`.
7. **`test/performance_production.test.js`:** Paginación (`page`, `limit`), filtros (`role`, `status`), validación de variables de entorno al inicio, health check sin exposición de secretos y bloqueo de endpoints internos en `NODE_ENV=production`.

---

## 📖 Documentación Interactiva con Swagger / OpenAPI (Pre-entrega Módulo 5)

Con el servidor corriendo en el puerto `3000`:
- **Swagger UI:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **OpenAPI JSON Spec:** [http://localhost:3000/api/docs.json](http://localhost:3000/api/docs.json)

---

## 🚀 Cómo Correr la API Localmente

1. **Instalar dependencias:**
   ```bash
   npm install
   ```
2. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   ```
3. **Iniciar en modo desarrollo (puerto 3000):**
   ```bash
   npm run dev
   ```
4. **Iniciar en modo producción:**
   ```bash
   npm start
   ```
5. **Ejecutar la suite de 59 tests funcionales:**
   ```bash
   npm test
   ```

---

## 👨‍💻 Autor

- **Tiago Pinfari**
- **Curso:** Backend 3 — Coderhouse
- **Proyecto:** ShipNow API
