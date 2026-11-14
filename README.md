# ShipNow API — Backend 3 (Coderhouse)

API RESTful profesional de logística para **ShipNow**, desarrollada bajo arquitectura en 3 capas (**Controller — Service — Repository**), validación estricta de variables de entorno al arranque, módulo de mocking con Faker, capa centralizada de manejo de errores, sistema profesional de logging con Winston, documentación interactiva con Swagger / OpenAPI 3.0, suite de testing funcional con Mocha, Chai y Supertest, y **gestión profesional de carga de archivos, documentos y comprobantes con Multer** (Pre-entrega Módulo 7).

---

## 🏛️ Arquitectura del Sistema

El sistema implementa el patrón de capas desacopladas asegurando alta cohesión, testeabilidad (separando `src/app.js` de `src/server.js`), independencia de la base de datos, observabilidad mediante logs, gestión de archivos en disco con metadatos en MongoDB y documentación OpenAPI modular:

```text
[ Cliente HTTP / Navegador / Supertest ]
       │
       ├───► GET /api/docs      ──► [ Swagger UI ] (src/config/swagger.js + src/docs/**/*.yaml)
       ├───► GET /api/docs.json ──► [ OpenAPI 3.0.3 Spec en JSON ]
       │
       ▼
  [ src/app.js ]           ──► Instancia Express desacoplada del puerto HTTP (importable por Supertest)
       │
       ▼
 [ httpLogger Middleware ] ──► Registra peticiones HTTP con Winston (método, URL, status, duración)
       │
       ▼
 [ Router ]                ──► Enrutamiento declarativo limpio (src/routes/*.js)
       │
       ├───► [ Multer Middleware ] ──► Validación de campo, formato MIME/extensión y tamaño (src/config/multer.config.js)
       │
       ▼
[ Controller ]             ──► Manejo de req/res. Delega errores en next(error).
       │
       ▼
 [ Service ]               ──► Reglas de negocio, almacenamiento en /uploads y asociación de metadatos.
       │
       ├───► [ Mocks Generator ] ──► Generación de datos simulados en memoria con Faker.
       │
       ▼
[ Repository ]             ──► Único componente que interactúa con Mongoose / MongoDB.
       │
       ▼
  [ Model ]                ──► Esquemas de datos Mongoose con validaciones nativas.

─────────────────────────────────────────────────────────────────────────────
[ CAPA CENTRALIZADA DE GESTIÓN Y LOGS DE ERRORES ]
─────────────────────────────────────────────────────────────────────────────
notFoundHandler (404) ──► logger.warning() ──► next(RouteNotFoundError)
                                                        │
                                                        ▼
errorHandler (Global)  ──► logger.warning() [4xx]  ──► errorResponse (JSON uniforme)
                       ──► logger.error()   [5xx]
                       ──► logger.fatal()   [crítico]
```

---

## 📂 Carga de Archivos, Documentos y Comprobantes con Multer (Pre-entrega Módulo 7)

La API incorpora gestión completa de archivos mediante **Multer** (`multipart/form-data`), separando la configuración en [`src/config/multer.config.js`](src/config/multer.config.js) para mantener los routers limpios y conectando todas las validaciones al sistema centralizado de errores y al logger de Winston.

### 🗂️ Estructura de Carpetas de Almacenamiento (`/uploads`)

Los archivos físicos se almacenan en el servidor organizados por subcarpetas según el tipo de documento (`DOCUMENT_TYPES`):

- `uploads/users/documents/` — Documentos de identidad / generales de usuario (`user_document`).
- `uploads/users/licenses/` — Licencias de conducir de repartidores (`driver_license`).
- `uploads/deliveries/proofs/` — Comprobantes asociados a entregas y pedidos (`delivery_proof`).

> **Exclusión en Git (`.gitignore`):** La carpeta `uploads/*` está ignorada en `.gitignore` (conservando únicamente `uploads/.gitkeep`) para evitar que archivos subidos durante pruebas o uso local se suban a GitHub.

### 🛡️ Validaciones y Reglas de Almacenamiento

1. **Formatos permitidos:** `PDF`, `JPG`, `JPEG`, `PNG` y `WEBP` (validación doble de `mimetype` y extensión).
2. **Tamaño máximo:** **5 MB** por archivo (`MAX_FILE_SIZE = 5 * 1024 * 1024`).
3. **Nombre del campo de archivo:** `file`.
4. **Prevención de archivos huérfanos:** El archivo se valida en memoria y **solo se escribe en disco después de confirmar que la entidad destino (usuario, entrega o pedido) existe en MongoDB** y que el `documentType` es válido.
5. **Solo metadatos en MongoDB:** En la base de datos nunca se guarda el binario del archivo, sino exclusivamente sus metadatos:
   - `originalName` / `name`: Nombre original del archivo.
   - `filename`: Nombre único generado con timestamp y sufijo aleatorio.
   - `path` / `reference`: Ruta relativa en el servidor (ej. `uploads/users/licenses/...`).
   - `mimetype`: Tipo MIME validado.
   - `size`: Tamaño en bytes.
   - `documentType`: `user_document`, `driver_license` o `delivery_proof`.
   - `uploadedAt`: Fecha de carga.

### 📡 Endpoints de Carga de Archivos (`multipart/form-data`)

| Método y Ruta | Campo Archivo | Campos Adicionales | Descripción |
| :--- | :---: | :---: | :--- |
| **`POST /api/users/:id/documents`** | `file` (requerido) | `documentType` (`user_document` \| `driver_license` \| `delivery_proof`) | Sube un documento o licencia, lo guarda en la subcarpeta correspondiente y registra sus metadatos en `user.documents`. |
| **`POST /api/deliveries/:id/proof`** | `file` (requerido) | `documentType` (opcional, default: `delivery_proof`) | Sube un comprobante de entrega, lo almacena en `uploads/deliveries/proofs` y registra los metadatos en `delivery.proof` y `delivery.proofs`. |
| **`POST /api/orders/:id/proof`** | `file` (requerido) | `documentType` (opcional, default: `delivery_proof`) | Sube un comprobante asociado a un pedido y registra sus metadatos en `order.proof` y `order.proofs`. |

---

## 🧪 Testing Funcional Automatizado (Pre-entrega Módulo 6 y 7)

El proyecto cuenta con una suite de **50 tests funcionales automatizados** que validan de punta a punta el comportamiento de todos los módulos, incluyendo la carga de archivos con Multer.

### 🛠️ Herramientas Utilizadas

| Herramienta | Rol en la Suite de Testing |
| :--- | :--- |
| **Mocha** | Test runner encargado de estructurar los bloques (`describe`, `it`), gestionar los hooks de ciclo de vida (`before`, `beforeEach`, `afterEach`, `after`) y ejecutar las pruebas. |
| **Chai** | Librería de aserciones (`expect`) utilizada para validar tipos de datos, códigos de estado, propiedades obligatorias y códigos del diccionario de errores. |
| **Supertest** | Cliente HTTP de alto nivel que importa directamente `src/app.js` (soportando JSON y `multipart/form-data` con `.attach()` y `.field()`) sin abrir manualmente un puerto. |
| **cross-env** | Garantiza la inyección multiplataforma de `NODE_ENV=test` al ejecutar el comando de pruebas. |

### 🔐 Separación del Entorno de Testing y Limpieza

- [`src/app.js`](src/app.js) define la aplicación Express desacoplada de `app.listen()`.
- En [`test/setup.test.js`](test/setup.test.js), si la base de datos remota no está accesible, se registra explícitamente una advertencia en el logger indicando el motivo de conexión antes de activar el adaptador de persistencia en memoria para que ningún error de entorno quede oculto.
- Los archivos físicos creados durante las pruebas de carga (`test/uploads.test.js`) se limpian automáticamente en el hook `afterEach` para mantener limpia la carpeta `uploads/`.

### ▶️ Cómo Ejecutar los Tests

```bash
npm test
```

### 📋 Suites de Pruebas en `/test` (50 Passing)

1. **`test/users.test.js` (`/api/users`):** ABM de usuarios y errores (`VALIDATION_ERROR`, `INVALID_USER_ROLE`, `FORBIDDEN_OPERATION`, `CONFLICT_ERROR`, `USER_NOT_FOUND`).
2. **`test/orders.test.js` (`/api/orders`):** Creación con cálculo de costos, consulta, actualización de estados y errores (`VALIDATION_ERROR`, `USER_NOT_FOUND`, `INVALID_STATUS`, `ORDER_NOT_FOUND`).
3. **`test/deliveries.test.js` (`/api/deliveries`):** Creación vinculada a pedido y repartidor, cambio de estado y errores (`INVALID_USER_ROLE`, `INVALID_STATUS`, `DELIVERY_NOT_FOUND`).
4. **`test/mocks.test.js` (`/api/mocks`):** Generación en memoria (`/users`, `/mockingUsers`, `/orders`), inserción con `POST /seed` y errores (`INVALID_QUANTITY`, `VALIDATION_ERROR`).
5. **`test/uploads.test.js` (Documentos y Comprobantes con Multer):**
   - Carga exitosa de documento PDF en usuario (`201`), comprobante PNG en entrega (`201`) y comprobante JPG en pedido (`201`), verificando archivo físico en disco y metadatos en la entidad.
   - Errores: falta de archivo (`400 FILE_REQUIRED`), tipo de archivo inválido (`400 INVALID_FILE_TYPE`), `documentType` inválido (`400 INVALID_DOCUMENT_TYPE`), archivo mayor a 5 MB (`400 FILE_TOO_LARGE`), y entidad inexistente (`404 USER_NOT_FOUND`, `404 DELIVERY_NOT_FOUND`, `404 ORDER_NOT_FOUND`).
6. **`test/system.test.js` (Logger, Swagger y 404):** Validación de `/api/loggerTest`, `/loggerTest`, `/api/docs/`, `/api/docs.json` y rutas inexistentes (`404 ROUTE_NOT_FOUND`).

---

## 📖 Documentación Interactiva con Swagger / OpenAPI (Pre-entrega Módulo 5)

Una vez iniciado el servidor en el puerto `3000`, la documentación interactiva se encuentra en:

- **Swagger UI:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **OpenAPI JSON Spec:** [http://localhost:3000/api/docs.json](http://localhost:3000/api/docs.json)

Incluye todos los módulos agrupados por tags (`Users`, `Orders`, `Deliveries`, `Products`, `Mocks`, `Logger`), todos los aliases (`/api/mocks/mockingUsers`, `/loggerTest`, `/api/health`, `/health`) y los endpoints `multipart/form-data` de carga de documentos y comprobantes listos para probar desde el botón **"Try it out"** seleccionando un archivo desde tu computadora.

---

## 🛡️ Diccionario Centralizado de Errores

Todos los errores del sistema responden con la estructura uniforme `ErrorResponse`:
```json
{
  "status": "error",
  "message": "Descripción clara del problema",
  "code": "CODIGO_ESTANDARIZADO"
}
```

Códigos soportados en [`src/utils/errorDictionary.js`](src/utils/errorDictionary.js):
- **Validación y Dominio (400):** `VALIDATION_ERROR`, `INVALID_QUANTITY`, `INVALID_USER_ROLE`, `INVALID_STATUS`
- **Archivos / Multer (400 / 500):** `FILE_REQUIRED` (400), `INVALID_FILE_TYPE` (400), `FILE_TOO_LARGE` (400), `INVALID_DOCUMENT_TYPE` (400), `FILE_STORAGE_ERROR` (500)
- **Permisos y Conflictos (403 / 409):** `FORBIDDEN_OPERATION` (403), `CONFLICT_ERROR` (409)
- **Recursos No Encontrados (404):** `ROUTE_NOT_FOUND`, `USER_NOT_FOUND`, `PRODUCT_NOT_FOUND`, `ORDER_NOT_FOUND`, `DELIVERY_NOT_FOUND`
- **Servidor y Base de Datos (500):** `INTERNAL_SERVER_ERROR`, `DATABASE_ERROR`

---

## 🚀 Instalación y Ejecución

1. **Instalar dependencias:**
   ```bash
   npm install
   ```
2. **Configurar variables de entorno:**
   Copiar `.env.example` a `.env` (puerto `3000`).
3. **Iniciar en desarrollo:**
   ```bash
   npm run dev
   ```
4. **Ejecutar los 50 tests funcionales:**
   ```bash
   npm test
   ```

---

## 👨‍💻 Autor

- **Tiago Pinfari**
- **Curso:** Backend 3 — Coderhouse
- **Proyecto:** ShipNow API
