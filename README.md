# ShipNow API — Proyecto Final Backend 3 (Coderhouse)

API RESTful profesional de gestión logística para **ShipNow**, consolidada para producción bajo una **arquitectura en 3 capas (Controller — Service — Repository)**. Integra validación estricta de variables de entorno al inicio (Fail-Fast), módulo de mocking y seeding con Faker, capa centralizada de manejo de errores, sistema de logging con Winston y rotación de archivos, documentación interactiva con Swagger / OpenAPI 3.0, carga de documentos y comprobantes con `multer.diskStorage`, suite de **59 tests funcionales automatizados** (Mocha, Chai, Supertest), paginación y filtrado en listados, y contenerización completa con **Docker** y **Docker Compose**.

---

## 🛠️ Tecnologías y Herramientas

| Categoría | Tecnologías Utilizadas |
| :--- | :--- |
| **Runtime & Framework** | Node.js (v20+ LTS, ES Modules), Express.js (`^4.21.2`) |
| **Base de Datos & ODM** | MongoDB, Mongoose (`^8.12.1`) |
| **Documentación API** | Swagger / OpenAPI 3.0.3 (`swagger-jsdoc`, `swagger-ui-express`) |
| **Logging & Monitoreo** | Winston (`^3.19.0`), `winston-daily-rotate-file` (`^5.0.0`) |
| **Carga de Archivos** | Multer (`^2.0.0`, `multer.diskStorage` con operaciones asíncronas `fs.promises`) |
| **Mocking & Datos** | `@faker-js/faker` (`^10.6.0`) |
| **Testing Funcional** | Mocha (`^12.0.3`), Chai (`^6.3.0`), Supertest (`^7.3.2`), `cross-env` |
| **Contenedores & Deploy** | Docker (`Dockerfile` sobre `node:20-alpine`), Docker Compose (`docker-compose.yml`) |

---

## 🏛️ Arquitectura General del Proyecto

El sistema respeta estrictamente la separación de responsabilidades en capas:
- **Routers (`src/routes/`):** Declaran los endpoints y conectan middlewares sin acceder jamás a Mongoose ni contener lógica de negocio.
- **Controllers (`src/controllers/`):** Extraen datos de `req` (`params`, `query`, `body`, `file`), invocan al servicio correspondiente y delegan cualquier excepción en `next(error)`.
- **Services (`src/services/`):** Concentran todas las reglas de negocio, validaciones de dominio, cálculo de costos de envío, paginación (`parsePaginationParams`), registro de eventos con Winston y asociación de metadatos de archivos.
- **Repositories (`src/repositories/`) & Models (`src/models/`):** Única capa que interactúa con MongoDB a través de Mongoose, aplicando filtros, ordenamientos y límites (`.find(filter).sort().skip().limit()`).

```text
├── src/
│   ├── app.js                     # Configuración de Express desacoplada del puerto HTTP (para Supertest)
│   ├── server.js                  # Punto de entrada: conexión a MongoDB y levantamiento del servidor HTTP
│   ├── config/
│   │   ├── env.config.js          # Validación Fail-Fast de variables de entorno por ambiente
│   │   ├── logger.js              # Logger Winston con 6 niveles personalizados y rotación de archivos
│   │   ├── multer.config.js       # Configuración centralizada de Multer (diskStorage, límites y filtros)
│   │   └── swagger.js             # Configuración modular de OpenAPI 3.0.3
│   ├── constants/
│   │   └── index.js               # Constantes inmutables (roles, estados, prioridades, tipos de documento)
│   ├── controllers/               # Controladores HTTP (user, order, delivery, product, mock)
│   ├── services/                  # Lógica de negocio y validaciones de dominio
│   ├── repositories/              # Acceso a datos encapsulado con paginación y populate
│   ├── models/                    # Esquemas Mongoose (User, Order, Delivery, Product)
│   ├── routes/                    # Enrutadores Express (/api/users, /orders, /deliveries, /products, /mocks, /loggerTest)
│   ├── middlewares/               # errorHandler, notFoundHandler, httpLogger, internalEndpointGuard
│   ├── mocks/                     # Generadores Faker coherentes con los modelos reales
│   ├── utils/                     # errorDictionary, clases CustomError, apiResponse, pagination
│   └── docs/                      # Especificaciones YAML de Swagger (schemas/ y paths/)
├── test/                          # Suite de 59 tests funcionales (Mocha + Chai + Supertest)
├── logs/                          # Carpeta para logs persistidos (archivos .log excluidos en .gitignore)
├── uploads/                       # Carpeta para archivos subidos (archivos excluidos en .gitignore)
├── .env.example                   # Plantilla de variables de entorno para desarrollo/producción
├── .env.test.example              # Plantilla de variables de entorno para ejecución reproducible de tests
├── Dockerfile                     # Imagen de producción multi-capa segura (USER node + HEALTHCHECK)
├── .dockerignore                  # Exclusión de archivos sensibles/temporales en la imagen Docker
└── docker-compose.yml             # Orquestación completa de ShipNow API + MongoDB 7 con volúmenes
```

---

## 🔐 Variables de Entorno Necesarias

La aplicación valida las variables críticas al iniciar mediante `validateEnvVariables()` en [`src/config/env.config.js`](src/config/env.config.js). Si falta alguna variable crítica (`PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `SHIPPING_API_KEY`), el servidor no arranca e informa explícitamente cuáles faltan.

El repositorio incluye dos plantillas listas para usar:
- [``.env.example``](.env.example): Plantilla para entorno local de desarrollo o producción.
- [``.env.test.example``](.env.test.example): Plantilla específica para el entorno de testing automatizado.

| Variable | Obligatoria | Descripción | Valor de Ejemplo |
| :--- | :---: | :--- | :--- |
| **`PORT`** | Sí | Puerto HTTP del servidor. | `3000` |
| **`NODE_ENV`** | Sí | Entorno de ejecución (`development`, `test`, `production`). | `development` |
| **`MONGODB_URI`** | Sí | URI de conexión a MongoDB (Desarrollo / Producción). | `mongodb://127.0.0.1:27017/shipnow` |
| **`MONGODB_TEST_URI`**| En test | URI de base de datos aislada para testing. | `mongodb://127.0.0.1:27017/shipnow_test` |
| **`JWT_SECRET`** | Sí | Secreto para firma de tokens. | `tu_clave_secreta_jwt` |
| **`SHIPPING_API_KEY`**| Sí | API Key para el cálculo de costos de envío. | `tu_shipping_api_key` |
| **`EXTERNAL_SHIPPING_API_URL`** | No | URL del servicio externo de cotización logística. | `https://api.shipping.shipnow.internal/v1/rates` |
| **`LOG_LEVEL`** | No | Nivel máximo de logs en consola (`debug` en dev, `info` en prod). | `debug` |
| **`ENABLE_SWAGGER_IN_PROD`** | No | Habilita (`true`) o bloquea (`false`) Swagger UI en producción. | `false` |
| **`ENABLE_INTERNAL_ENDPOINTS_IN_PROD`** | No | Habilita (`true`) o bloquea (`false`) Mocks y LoggerTest en producción. | `false` |

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos
- **Node.js** v18 o superior (recomendado v20 LTS)
- **MongoDB** ejecutándose localmente o URI de **MongoDB Atlas**

### Paso a paso
1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Tiagopinfari/proyecto-ShipNow.git
   cd proyecto-ShipNow
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar los archivos de variables de entorno:**
   ```bash
   cp .env.example .env
   cp .env.test.example .env.test
   ```
   *(En Windows PowerShell: `Copy-Item .env.example .env; Copy-Item .env.test.example .env.test`)*

4. **Iniciar el servidor en modo desarrollo (con recarga automática):**
   ```bash
   npm run dev
   ```

5. **Iniciar el servidor en modo producción:**
   ```bash
   npm start
   ```

El servidor quedará disponible en **`http://localhost:3000`**.

---

## 🧪 Cómo Correr los Tests Funcionales (Mocha, Chai y Supertest)

El proyecto cuenta con una suite de **59 tests funcionales automatizados** que verifican todos los módulos, el formato uniforme de errores, los mocks, el logger, Swagger, la carga de archivos con Multer, la paginación y las protecciones de producción.

### Preparación del entorno de Testing (Reproducibilidad)
- Para ejecutar los tests con tu propia configuración de prueba, creá el archivo `.env.test` a partir de la plantilla incluida en el repositorio:
  ```bash
  cp .env.test.example .env.test
  ```
- **Fallback automático para evaluación inmediata:** Si clonás el repositorio y ejecutás `npm test` directamente sin haber creado antes `.env` ni `.env.test`, [`src/config/env.config.js`](src/config/env.config.js) detecta `NODE_ENV=test` y carga automáticamente las variables de [``.env.test.example``](.env.test.example). Además, si no hay una instancia de MongoDB activa en `localhost:27017`, [`test/setup.test.js`](test/setup.test.js) emite una advertencia explícita en consola y activa el adaptador aislado en memoria para que los 59 tests puedan ejecutarse sin fallar ni depender de datos externos.

### Comando de ejecución
```bash
npm test
```

### Cobertura de la Suite (`59 passing`)
1. **`test/users.test.js`:** Listado, creación, consulta por ID, actualización, eliminación y errores (`VALIDATION_ERROR`, `INVALID_USER_ROLE`, `FORBIDDEN_OPERATION`, `CONFLICT_ERROR`, `USER_NOT_FOUND`).
2. **`test/orders.test.js`:** Creación con cálculo automático de envío y total, listado con cliente poblado, consulta por ID, cambio de estado/prioridad y errores (`VALIDATION_ERROR`, `USER_NOT_FOUND`, `INVALID_STATUS`, `ORDER_NOT_FOUND`).
3. **`test/deliveries.test.js`:** Creación vinculada a pedido y repartidor con rol válido, actualización de estado a `delivered` y errores (`INVALID_USER_ROLE`, `INVALID_STATUS`, `DELIVERY_NOT_FOUND`).
4. **`test/mocks.test.js`:** Generación en memoria (`/users`, `/mockingUsers`, `/orders`) comprobando no persistencia, carga con `POST /seed` y errores (`INVALID_QUANTITY`, `VALIDATION_ERROR`).
5. **`test/uploads.test.js`:** Carga `multipart/form-data` de documentos PDF en usuarios y comprobantes PNG/JPG en entregas y pedidos con `multer.diskStorage`, limpieza automática de archivos de prueba y validación de errores (`FILE_REQUIRED`, `INVALID_FILE_TYPE`, `FILE_TOO_LARGE`, `INVALID_DOCUMENT_TYPE`, `404`).
6. **`test/system.test.js`:** Validación de `/api/loggerTest`, `/loggerTest`, `/api/docs/`, `/api/docs.json` y rutas inexistentes (`404 ROUTE_NOT_FOUND`).
7. **`test/performance_production.test.js`:** Paginación (`page`, `limit`), filtros (`role`, `status`), validación Fail-Fast de variables de entorno, health check sin exposición de secretos y bloqueo `403` de endpoints internos en `NODE_ENV=production`.

---

## 📖 Cómo Acceder a Swagger (Documentación Interactiva OpenAPI 3.0)

Con el servidor en ejecución (en desarrollo o en Docker con `ENABLE_SWAGGER_IN_PROD=true`), accedé desde el navegador a:

- **Swagger UI Interactiva:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Especificación JSON:** [http://localhost:3000/api/docs.json](http://localhost:3000/api/docs.json)

La documentación está organizada en 6 tags (**`Users`**, **`Orders`**, **`Deliveries`**, **`Products`**, **`Mocks`**, **`Logger`**), incluye schemas reutilizables (`User`, `Order`, `OrderItem`, `Delivery`, `Product`, `FileMetadata`, `SeedInput`, `SeedResponse`, `ErrorResponse`), parámetros de paginación/filtros y soporte directo para subir archivos en los endpoints `multipart/form-data` mediante **"Try it out"**.

---

## 🐳 Cómo Usar Docker y Docker Compose

### Opción A: Construir y Ejecutar el Contenedor Individual (`Dockerfile`)

1. **Construir la imagen:**
   ```bash
   docker build -t shipnow-api:1.0 .
   ```

2. **Ejecutar el contenedor con variables de entorno y volúmenes para persistir `logs/` y `uploads/`:**
   ```bash
   docker run -d \
     --name shipnow-container \
     -p 3000:3000 \
     --env-file .env \
     -e ENABLE_SWAGGER_IN_PROD=true \
     -e ENABLE_INTERNAL_ENDPOINTS_IN_PROD=true \
     -v "$(pwd)/logs:/usr/src/app/logs" \
     -v "$(pwd)/uploads:/usr/src/app/uploads" \
     shipnow-api:1.0
   ```
   *(En Windows PowerShell reemplazá `$(pwd)` por `${PWD}`)*:
   ```powershell
   docker run -d --name shipnow-container -p 3000:3000 --env-file .env -e ENABLE_SWAGGER_IN_PROD=true -e ENABLE_INTERNAL_ENDPOINTS_IN_PROD=true -v "${PWD}/logs:/usr/src/app/logs" -v "${PWD}/uploads:/usr/src/app/uploads" shipnow-api:1.0
   ```

### Opción B: Levantar Todo el Stack con Docker Compose (`docker-compose.yml`)

El repositorio incluye un archivo [`docker-compose.yml`](docker-compose.yml) que levanta automáticamente **ShipNow API** junto con una base de datos **MongoDB 7**, configurando la red interna, el healthcheck de base de datos y los volúmenes persistentes para `logs/`, `uploads/` y datos de Mongo:

```bash
# Levantar API + MongoDB en segundo plano
docker compose up -d --build

# Consultar logs en tiempo real
docker compose logs -f shipnow-api

# Detener los servicios
docker compose down
```

---

## 📂 Aclaraciones sobre Logs, Uploads, Archivos Excluidos y Producción

1. **Archivos que NO deben subirse al repositorio (`.gitignore` y `.dockerignore`):**
   Están estrictamente excluidos `node_modules/`, `.env`, `.env.test`, `logs/*.log`, `uploads/*` (excepto los archivos vacíos `.gitkeep` que preservan la estructura de directorios), `coverage/` y archivos temporales.
2. **Persistencia de `logs/` (Winston):**
   - En desarrollo la consola muestra desde `debug` hasta `fatal` con colores; en producción muestra desde `info` hasta `fatal`.
   - Los niveles `error` y `fatal` se persisten en `logs/error.log` (rotación por tamaño a los 5 MB) y en `logs/errors-%DATE%.log` (rotación diaria con retención de 14 días).
3. **Almacenamiento de `uploads/` (Multer `diskStorage`):**
   - Los archivos válidos (`PDF`, `JPG`, `JPEG`, `PNG`, `WEBP` hasta **5 MB**) se almacenan físicamente en `uploads/users/documents`, `uploads/users/licenses` y `uploads/deliveries/proofs`.
   - En MongoDB **solo se guardan los metadatos** (`originalName`, `filename`, `path`, `mimetype`, `size`, `documentType`, `uploadedAt`), nunca el archivo binario.
   - Si la validación de negocio falla (ej. entidad inexistente), el archivo se elimina asíncronamente con `removeUploadedFileAsync()` para no dejar archivos basura.
4. **Criterio sobre Endpoints Internos en Producción (`internalEndpointGuard`):**
   - En `NODE_ENV=development` y `NODE_ENV=test`, las rutas `/api/mocks/*`, `/api/loggerTest` y `/api/docs` están abiertas.
   - En `NODE_ENV=production`, quedan bloqueadas por defecto con `403 FORBIDDEN_OPERATION` por seguridad, pudiendo habilitarse de forma controlada mediante `ENABLE_INTERNAL_ENDPOINTS_IN_PROD=true` y `ENABLE_SWAGGER_IN_PROD=true`.

---

## 📡 Resumen de Endpoints Principales

### 🩺 Monitoreo, Logger y Documentación
| Método | Ruta | Descripción |
| :---: | :--- | :--- |
| `GET` | `/api/health` (y `/health`) | Health check seguro (`status`, `environment`, `uptime`, `timestamp`). |
| `GET` | `/api/docs` (y `/api/docs.json`) | Interfaz interactiva Swagger UI y especificación OpenAPI 3.0.3. |
| `GET` | `/api/loggerTest` (y `/loggerTest`) | Herramienta interna que dispara los 6 niveles de logs en Winston. |

### 👤 Usuarios (`/api/users`)
| Método | Ruta | Descripción |
| :---: | :--- | :--- |
| `GET` | `/api/users?page=1&limit=20&role=...` | Listar usuarios paginados y filtrados por rol o email. |
| `GET` | `/api/users/:id` | Obtener usuario por ObjectId. |
| `POST` | `/api/users` | Crear usuario (valida unicidad de email y roles permitidos). |
| `PUT` | `/api/users/:id` | Actualizar datos de un usuario existente. |
| `DELETE` | `/api/users/:id` | Eliminar un usuario por ID. |
| `POST` | `/api/users/:id/documents` | Subir documento o licencia (`multipart/form-data`, campo `file` + `documentType`). |

### 📦 Pedidos (`/api/orders`)
| Método | Ruta | Descripción |
| :---: | :--- | :--- |
| `GET` | `/api/orders?page=1&limit=20&status=...` | Listar pedidos paginados con cliente poblado y filtros (`status`, `priority`, `customer`). |
| `GET` | `/api/orders/:id` | Consultar detalle de un pedido por ID. |
| `POST` | `/api/orders` | Crear pedido (valida cliente, ítems y calcula `shippingCost` y `total`). |
| `PUT` | `/api/orders/:id` | Actualizar estado, prioridad o dirección de un pedido. |
| `DELETE` | `/api/orders/:id` | Eliminar un pedido por ID. |
| `POST` | `/api/orders/:id/proof` | Subir comprobante asociado al pedido (`multipart/form-data`, campo `file`). |

### 🚚 Entregas (`/api/deliveries`)
| Método | Ruta | Descripción |
| :---: | :--- | :--- |
| `GET` | `/api/deliveries?page=1&limit=20&status=...` | Listar entregas paginadas con pedido y repartidor poblados y filtros. |
| `GET` | `/api/deliveries/:id` | Consultar una entrega por ID. |
| `POST` | `/api/deliveries` | Crear entrega vinculada a un pedido y un usuario con rol `driver`/`repartidor`. |
| `PUT` | `/api/deliveries/:id` | Actualizar estado (`pending`, `assigned`, `in_transit`, `delivered`) o prioridad. |
| `DELETE` | `/api/deliveries/:id` | Eliminar una entrega por ID. |
| `POST` | `/api/deliveries/:id/proof` | Subir comprobante de entrega (`multipart/form-data`, campo `file`). |

### 🏷️ Productos (`/api/products`)
| Método | Ruta | Descripción |
| :---: | :--- | :--- |
| `GET` | `/api/products?page=1&limit=20&all=false` | Listar productos disponibles en stock (o todos con `all=true`). |
| `GET` | `/api/products/:id` | Obtener producto por ID. |
| `GET` | `/api/products/:id/shipping-cost` | Cotizar costo de envío del producto según el entorno. |
| `POST` | `/api/products` | Crear producto validando código único y stock. |
| `PUT` | `/api/products/:id` | Actualizar producto y recalcular estado según stock. |
| `DELETE` | `/api/products/:id` | Eliminar producto por ID. |

### 🎭 Mocks y Seeding (`/api/mocks`)
| Método | Ruta | Descripción |
| :---: | :--- | :--- |
| `GET` | `/api/mocks/users?qty=10` (y `/mockingUsers`) | Generar usuarios simulados en memoria con Faker (0 a 400). |
| `GET` | `/api/mocks/orders?qty=10` | Generar pedidos simulados en memoria. |
| `GET` | `/api/mocks/deliveries?qty=10` | Generar entregas simuladas en memoria. |
| `GET` | `/api/mocks/all?qty=10` | Generar conjunto completo simulado en memoria. |
| `POST` | `/api/mocks/seed` | Insertar datos de prueba en MongoDB (`qty`, `collection`: `usuarios`, `pedidos`, `entregas`, `all`). |

---

## 👨‍💻 Autor

- **Tiago Pinfari**
- **Curso:** Programación Backend III: Testing y Escalabilidad Backend — Coderhouse
- **Proyecto:** ShipNow API (Entrega Final)
