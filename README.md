# ShipNow API — Backend 3 (Coderhouse)

API RESTful profesional de logística para **ShipNow**, desarrollada bajo arquitectura en 3 capas (**Controller — Service — Repository**), validación estricta de variables de entorno al arranque, módulo de mocking con Faker, capa centralizada de manejo de errores, sistema profesional de logging con Winston, documentación interactiva con Swagger / OpenAPI 3.0 y **suite de testing funcional automatizado con Mocha, Chai y Supertest** (Pre-entrega Módulo 6).

---

## 🏛️ Arquitectura del Sistema

El sistema implementa el patrón de capas desacopladas asegurando alta cohesión, testeabilidad (separando `src/app.js` de `src/server.js`), independencia de la base de datos, observabilidad mediante logs y documentación OpenAPI modular:

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
       ▼
[ Controller ]             ──► Manejo de req/res. Delega errores en next(error).
       │
       ▼
 [ Service ]               ──► Reglas de negocio. Emite logs informativos y advertencias de dominio.
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

## 🧪 Testing Funcional Automatizado (Pre-entrega Módulo 6)

El proyecto cuenta con una suite de **40 tests funcionales automatizados** que validan de punta a punta el comportamiento de los endpoints principales, tanto en **casos exitosos** como en **casos de error esperados**, verificando códigos de estado HTTP y la estructura exacta del cuerpo JSON de respuesta.

### 🛠️ Herramientas Utilizadas

| Herramienta | Rol en la Suite de Testing |
| :--- | :--- |
| **Mocha** | Test runner encargado de estructurar los bloques (`describe`, `it`), gestionar los hooks de ciclo de vida (`before`, `beforeEach`, `after`) y ejecutar las pruebas. |
| **Chai** | Librería de aserciones (`expect`) utilizada para validar tipos de datos, códigos de estado, propiedades obligatorias y códigos del diccionario de errores. |
| **Supertest** | Cliente HTTP de alto nivel que importa directamente `src/app.js` para ejecutar peticiones contra la API sin necesidad de levantar manualmente un puerto. |
| **cross-env** | Garantiza la inyección multiplataforma de `NODE_ENV=test` al ejecutar el comando de pruebas. |

### 🔐 Separación del Entorno de Testing y Base de Datos

1. **Separación de `app` y `server`:**
   - [`src/app.js`](src/app.js) configura los middlewares, rutas, Swagger y manejadores de errores sin ejecutar `app.listen()`.
   - [`src/server.js`](src/server.js) importa `app`, establece la conexión con MongoDB e inicia el servidor HTTP únicamente cuando no se está ejecutando en modo `test`.
2. **Variables de entorno y Base de Datos aislada:**
   - Al correr `npm test`, `NODE_ENV` se establece en `test`.
   - [`src/config/env.config.js`](src/config/env.config.js) carga automáticamente `.env.test` (si existe) y selecciona la variable `MONGODB_TEST_URI` (o redirige automáticamente la base de datos a `shipnow_test`), asegurando que **nunca se toquen ni contaminen los datos de desarrollo o producción**.
   - Si se corre en un entorno sin conexión a una instancia de MongoDB activa, [`test/setup.test.js`](test/setup.test.js) dispone de un adaptador de persistencia aislado en memoria para garantizar que la suite sea 100% reproducible en cualquier entorno de evaluación.
3. **Estrategia de Limpieza y Datos Controlados:**
   - Los datos de prueba se generan de forma repetible usando los generadores de mocks (`generateMockUser`, etc.).
   - En cada suite se limpian las colecciones involucradas mediante hooks `beforeEach` y `after` (`deleteMany({})`), evitando que un test dependa del estado previo o del orden de ejecución.

### ▶️ Cómo Ejecutar los Tests

Para correr la suite completa de tests funcionales:

```bash
npm test
```

*(Ejecuta internamente: `cross-env NODE_ENV=test mocha "test/**/*.test.js" --timeout 20000 --exit`)*

### 📋 Módulos y Casos Cubiertos en `/test`

- **`test/users.test.js` (`/api/users`):**
  - **Exitosos:** Listado de usuarios (`200`), creación de usuario válido (`201`), obtención por ID (`200`), actualización (`200`) y eliminación (`200`).
  - **Errores:** Datos incompletos (`400 VALIDATION_ERROR`), rol inexistente (`400 INVALID_USER_ROLE`), intento de crear rol `admin` (`403 FORBIDDEN_OPERATION`), email duplicado (`409 CONFLICT_ERROR`), ID inexistente (`404 USER_NOT_FOUND`) e ID malformado (`400 VALIDATION_ERROR`).
- **`test/orders.test.js` (`/api/orders`):**
  - **Exitosos:** Creación de pedido asociado a un cliente válido verificando cálculo automático de `declaredValue`, `shippingCost` y `total` (`201`), listado con cliente poblado (`200`), consulta por ID (`200`), actualización de estado y prioridad (`200`), y eliminación (`200`).
  - **Errores:** Pedido sin ítems (`400 VALIDATION_ERROR`), cliente inexistente (`404 USER_NOT_FOUND`), estado inválido al crear o actualizar (`400 INVALID_STATUS`), y pedido inexistente (`404 ORDER_NOT_FOUND`).
- **`test/deliveries.test.js` (`/api/deliveries`):**
  - **Exitosos:** Creación de entrega asociada a pedido y repartidor válido (`201`) y actualización de estado a `delivered` (`200`).
  - **Errores:** Asignación de un usuario que no tiene rol de repartidor (`400 INVALID_USER_ROLE`), actualización con estado inválido (`400 INVALID_STATUS`) y entrega inexistente (`404 DELIVERY_NOT_FOUND`).
- **`test/mocks.test.js` (`/api/mocks`):**
  - **Exitosos:** Generación en memoria de usuarios (`GET /api/mocks/users`), alias `GET /api/mocks/mockingUsers`, pedidos (`GET /api/mocks/orders`) comprobando que no persisten en DB, e inserción controlada con `POST /api/mocks/seed` (`201`).
  - **Errores:** Cantidades negativas (`qty=-5`), no numéricas (`qty=abc`), superiores al límite (`qty=999`), `qty=0` en seed (`400 INVALID_QUANTITY`) y colección inválida (`400 VALIDATION_ERROR`).
- **`test/system.test.js` (Logger, Swagger y 404):**
  - **Exitosos:** Validación de `GET /api/loggerTest` y su alias `GET /loggerTest` (`200` con los 6 niveles de Winston), carga de la interfaz HTML en `GET /api/docs/` (`200`) y especificación JSON en `GET /api/docs.json` (`200`).
  - **Errores:** Petición a ruta inexistente verificando respuesta `404` y código `ROUTE_NOT_FOUND`.

---

## 📖 Documentación Interactiva con Swagger / OpenAPI (Pre-entrega Módulo 5)

La API cuenta con documentación interactiva construida con **OpenAPI 3.0.3**, utilizando `swagger-jsdoc` y `swagger-ui-express`.
Toda la configuración se centraliza en [`src/config/swagger.js`](src/config/swagger.js) y las especificaciones YAML se organizan modularmente en `src/docs/`.

### 🔗 Rutas de Acceso a la Documentación

Una vez iniciado el servidor (por defecto en el puerto `3000`), podés acceder a:

- **Interfaz Interactiva (Swagger UI):** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Especificación OpenAPI en formato JSON:** [http://localhost:3000/api/docs.json](http://localhost:3000/api/docs.json)

### 🗂️ Módulos y Rutas Documentadas (Tags)

| Tag | Archivos YAML | Endpoints Documentados (incluyendo Aliases) |
| :--- | :--- | :--- |
| **`Users`** | `src/docs/paths/users.yaml` | `GET /api/users`, `POST /api/users`, `GET /api/users/{id}`, `PUT /api/users/{id}`, `DELETE /api/users/{id}` |
| **`Orders`** | `src/docs/paths/orders.yaml` | `GET /api/orders`, `POST /api/orders`, `GET /api/orders/{id}`, `PUT /api/orders/{id}`, `DELETE /api/orders/{id}` |
| **`Deliveries`** | `src/docs/paths/deliveries.yaml` | `GET /api/deliveries`, `POST /api/deliveries`, `GET /api/deliveries/{id}`, `PUT /api/deliveries/{id}`, `DELETE /api/deliveries/{id}` |
| **`Products`** | `src/docs/paths/products.yaml` | `GET /api/products`, `POST /api/products`, `GET /api/products/{id}`, `PUT /api/products/{id}`, `DELETE /api/products/{id}`, `GET /api/products/{id}/shipping-cost` |
| **`Mocks`** | `src/docs/paths/mocks.yaml` | `GET /api/mocks/users`, `GET /api/mocks/mockingUsers` *(alias)*, `GET /api/mocks/orders`, `GET /api/mocks/deliveries`, `GET /api/mocks/all`, `POST /api/mocks/seed` |
| **`Logger`** | `src/docs/paths/logger.yaml` | `GET /api/loggerTest`, `GET /loggerTest` *(alias)*, `GET /api/health`, `GET /health` *(alias)* |

### 🧩 Schemas Reutilizables (`src/docs/schemas/components.yaml`)

Todos los endpoints referencian esquemas centralizados en `#/components/schemas/`:
- **Entidades principales:** `User`, `Order`, `OrderItem`, `Delivery`, `Product`, `UserDocument`.
- **DTOs de entrada (Request Bodies):** `UserInput`, `UserUpdateInput`, `OrderInput`, `OrderUpdateInput`, `DeliveryInput`, `DeliveryUpdateInput`, `ProductInput`, `SeedInput`.
- **Respuestas estandarizadas:** `ErrorResponse`, `SuccessResponse`, `DeleteMessageResponse`, `SeedResponse`, `LoggerTestResponse`.

### 💡 Guía Rápida para Probar desde Swagger UI ("Try it out")

1. **Poblar datos rápidamente con Seed:**
   - En el tag **`Mocks`** → `POST /api/mocks/seed`, presioná **"Try it out"** y ejecutalo con `collection: "all"` y `qty: 5`.
2. **Probar creación de Pedidos (`POST /api/orders`) y Entregas (`POST /api/deliveries`):**
   - Ejecutá `GET /api/users` para copiar un `_id` real de un usuario con rol `customer` (para crear un pedido) o con rol `driver` (para asignar una entrega).
3. **Verificar errores documentados:**
   - Probá enviar `qty=-5` en `GET /api/mocks/users` o `GET /api/mocks/mockingUsers` para observar el error `400 INVALID_QUANTITY`.

---

## 📝 Sistema de Logging Profesional (Pre-entrega Módulo 4)

Implementado en [`src/config/logger.js`](src/config/logger.js) con **Winston** y **winston-daily-rotate-file**:

| Nivel | Prioridad | Color | Uso en ShipNow API |
| :--- | :---: | :---: | :--- |
| **`fatal`** | 0 | Magenta | Errores críticos de conexión inicial a MongoDB o arranque. |
| **`error`** | 1 | Rojo | Errores inesperados del servidor (5xx) o fallas de base de datos. |
| **`warning`**| 2 | Amarillo | Errores esperados de negocio/validación (4xx) y rutas no encontradas (404). |
| **`info`** | 3 | Azul | Eventos clave del servidor y operaciones de negocio exitosas. |
| **`http`** | 4 | Verde | Registro de cada petición HTTP con código de estado y duración en ms. |
| **`debug`** | 5 | Cyan | Mensajes detallados para depuración en desarrollo. |

- **Desarrollo (`NODE_ENV=development`):** Consola activa desde `debug` hasta `fatal`.
- **Producción (`NODE_ENV=production`):** Consola activa desde `info` hasta `fatal`.
- **Persistencia y Rotación:** Los niveles `error` y `fatal` se persisten en `logs/error.log` (máx. 5 MB) y `logs/errors-%DATE%.log` (rotación diaria, retención de 14 días).

---

## 🛡️ Capa Centralizada de Gestión Profesional de Errores (Pre-entrega Módulo 3)

Todos los errores responden con la estructura uniforme definida en `ErrorResponse`:
```json
{
  "status": "error",
  "message": "Descripción clara del problema",
  "code": "CODIGO_ESTANDARIZADO"
}
```

Códigos del diccionario de errores ([`src/utils/errorDictionary.js`](src/utils/errorDictionary.js)):
- `VALIDATION_ERROR` (400), `INVALID_QUANTITY` (400), `INVALID_USER_ROLE` (400), `INVALID_STATUS` (400)
- `FORBIDDEN_OPERATION` (403)
- `ROUTE_NOT_FOUND` (404), `USER_NOT_FOUND` (404), `PRODUCT_NOT_FOUND` (404), `ORDER_NOT_FOUND` (404), `DELIVERY_NOT_FOUND` (404)
- `CONFLICT_ERROR` (409)
- `INTERNAL_SERVER_ERROR` (500), `DATABASE_ERROR` (500)

---

## 🚀 Instalación, Variables de Entorno y Ejecución

### Prerrequisitos
- **Node.js** (v18+)
- **MongoDB** local o cluster en MongoDB Atlas

### Variables de Entorno (`.env.example`)
Copiá el archivo `.env.example` a `.env` y configurá tus valores (todos los archivos usan de forma consistente el puerto `3000`):

```env
# Configuración de Entorno y Servidor
PORT=3000
NODE_ENV=development

# Base de Datos MongoDB (Desarrollo / Producción)
MONGODB_URI=mongodb://127.0.0.1:27017/shipnow

# Base de Datos MongoDB exclusiva para Testing (Mocha / Chai / Supertest)
MONGODB_TEST_URI=mongodb://127.0.0.1:27017/shipnow_test

# Seguridad y Servicios Externos
JWT_SECRET=tu_clave_secreta_jwt
SHIPPING_API_KEY=tu_shipping_api_key
```

### Comandos Disponibles

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar servidor en modo desarrollo:**
   ```bash
   npm run dev
   ```

3. **Iniciar servidor en modo producción:**
   ```bash
   npm start
   ```

4. **Ejecutar la suite de tests funcionales:**
   ```bash
   npm test
   ```

---

## 👨‍💻 Autor

- **Tiago Pinfari**
- **Curso:** Backend 3 — Coderhouse
- **Proyecto:** ShipNow API
