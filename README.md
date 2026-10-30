# ShipNow API — Backend 3 (Coderhouse)

API RESTful profesional de logística para **ShipNow**, desarrollada bajo arquitectura en 3 capas (**Controller — Service — Repository**), validación estricta de variables de entorno al arranque, módulo de mocking con Faker, capa centralizada de manejo de errores, sistema profesional de logging con Winston y **documentación interactiva completa con Swagger / OpenAPI 3.0** (Pre-entrega Módulo 5).

---

## 🏛️ Arquitectura del Sistema

El sistema implementa el patrón de capas desacopladas asegurando alta cohesión, testeabilidad, independencia de la base de datos, observabilidad completa y documentación desacoplada de las rutas:

```text
[ Cliente HTTP / Navegador ]
       │
       ├───► GET /api/docs      ──► [ Swagger UI ] (src/config/swagger.js + src/docs/**/*.yaml)
       │
       ▼
 [ httpLogger Middleware ] ──► Registra peticiones HTTP con Winston (método, URL, status, duración)
       │
       ▼
 [ Router ]                ──► Enrutamiento declarativo limpio (sin comentarios Swagger mezclados)
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

## 📖 Documentación Interactiva con Swagger / OpenAPI (Pre-entrega Módulo 5)

La API cuenta con documentación interactiva construida con **OpenAPI 3.0.3**, utilizando `swagger-jsdoc` y `swagger-ui-express`.
Para mantener las rutas limpias y respetar la separación de responsabilidades, toda la configuración se centraliza en `src/config/swagger.js` y las especificaciones YAML se organizan modularmente en `src/docs/`.

### 🔗 Rutas de Acceso a la Documentación

Una vez iniciado el servidor (por defecto en el puerto `3000`), podés acceder a:

- **Interfaz Interactiva (Swagger UI):** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Especificación OpenAPI en formato JSON:** [http://localhost:3000/api/docs.json](http://localhost:3000/api/docs.json)

### 🗂️ Módulos Documentados (Tags)

La documentación está organizada en los siguientes grupos funcionales:

| Tag | Archivos YAML | Descripción y Alcance |
| :--- | :--- | :--- |
| **`Users`** | `src/docs/paths/users.yaml` | ABM completo de usuarios (`GET`, `POST`, `PUT`, `DELETE`), validación de roles e impedimento de creación directa de `admin`. |
| **`Orders`** | `src/docs/paths/orders.yaml` | Gestión de pedidos con validación de existencia del cliente, ítems obligatorios, cálculo automático de costo de envío y estados/prioridades. |
| **`Deliveries`** | `src/docs/paths/deliveries.yaml` | Gestión de entregas logísticas vinculadas a pedidos existentes y validación de rol `driver`/`repartidor`. |
| **`Products`** | `src/docs/paths/products.yaml` | Catálogo de productos, filtro por disponibilidad, control de stock y cotización de envío (`/shipping-cost`). |
| **`Mocks`** | `src/docs/paths/mocks.yaml` | Generación en memoria (`/users`, `/orders`, `/deliveries`, `/all`) e inserción controlada en MongoDB (`POST /api/mocks/seed`). |
| **`Logger`** | `src/docs/paths/logger.yaml` | Endpoint `GET /api/loggerTest`, documentado explícitamente como **herramienta interna de validación técnica** (no es una funcionalidad de negocio). |

### 🧩 Schemas Reutilizables (`src/docs/schemas/components.yaml`)

Todos los endpoints referencian esquemas centralizados en `#/components/schemas/`:
- **Entidades principales:** `User`, `Order`, `OrderItem`, `Delivery`, `Product`, `UserDocument`.
- **DTOs de entrada (Request Bodies):** `UserInput`, `UserUpdateInput`, `OrderInput`, `OrderUpdateInput`, `DeliveryInput`, `DeliveryUpdateInput`, `ProductInput`, `SeedInput`.
- **Respuestas estandarizadas:** `ErrorResponse`, `SuccessResponse`, `DeleteMessageResponse`, `SeedResponse`, `LoggerTestResponse`.

### 💡 Aclaraciones para Probar los Endpoints desde Swagger UI ("Try it out")

1. **Poblar datos rápidamente con Seed:**
   - Dirigite al tag **`Mocks`** → `POST /api/mocks/seed`, presioná **"Try it out"** y ejecutalo con `collection: "all"` y `qty: 5`. Esto creará clientes, repartidores, pedidos y entregas reales en MongoDB.
2. **Probar creación de Pedidos (`POST /api/orders`) y Entregas (`POST /api/deliveries`):**
   - Primero ejecutá `GET /api/users` para copiar un `_id` real de un usuario con rol `customer` (para crear un pedido) o con rol `driver` (para asignar una entrega).
3. **Verificar errores documentados:**
   - Podés probar enviar `qty=-5` o `qty=500` en `GET /api/mocks/users` para observar la respuesta `400 Bad Request` con código `INVALID_QUANTITY`.
   - Podés enviar un estado inexistente en `POST /api/orders` o `POST /api/deliveries` para verificar el error `400 Bad Request` con código `INVALID_STATUS`.

---

## 📝 Sistema de Logging Profesional (Pre-entrega Módulo 4)

La API cuenta con un logger centralizado implementado con **Winston** y rotación de archivos mediante **winston-daily-rotate-file**. Se eliminaron todos los `console.log` y `console.error` en favor de registros estructurados con niveles de criticidad.

### 📊 Niveles de Log Configurados

| Nivel | Prioridad | Color | Uso en ShipNow API |
| :--- | :---: | :---: | :--- |
| **`fatal`** | 0 | Magenta | Errores críticos que impiden la operación (fallas de conexión inicial a MongoDB o arranque del servidor). |
| **`error`** | 1 | Rojo | Errores inesperados del servidor (errores 5xx, fallas de persistencia o excepciones no controladas). |
| **`warning`**| 2 | Amarillo | Advertencias y errores esperados del dominio/negocio (4xx: recurso no encontrado, validaciones, cantidades inválidas). |
| **`info`** | 3 | Azul | Eventos informativos clave (inicio del servidor, conexión a MongoDB, creación de entidades, seeds). |
| **`http`** | 4 | Verde | Registro de cada petición HTTP completada con status code y tiempo de respuesta en milisegundos. |
| **`debug`** | 5 | Cyan | Mensajes detallados para desarrollo y depuración granular. |

### 🌐 Comportamiento según el Entorno (`NODE_ENV`)

1. **Entorno Desarrollo (`development`):** Consola en nivel `debug` (muestra todos los niveles con colores) y persistencia de `error` y `fatal` en archivos.
2. **Entorno Producción (`production`):** Consola en nivel `info` (omite `debug` y `http`) y persistencia de `error` y `fatal` con rotación diaria en `logs/error.log` y `logs/errors-%DATE%.log`.

---

## 🛡️ Capa Centralizada de Gestión Profesional de Errores (Pre-entrega Módulo 3)

Todos los errores del sistema responden bajo un esquema JSON uniforme documentado en `ErrorResponse`:
```json
{
  "status": "error",
  "message": "Descripción clara del problema",
  "code": "CODIGO_ESTANDARIZADO"
}
```

Códigos del diccionario de errores (`src/utils/errorDictionary.js`):
- `VALIDATION_ERROR` (400), `INVALID_QUANTITY` (400), `INVALID_USER_ROLE` (400), `INVALID_STATUS` (400)
- `FORBIDDEN_OPERATION` (403)
- `ROUTE_NOT_FOUND` (404), `USER_NOT_FOUND` (404), `PRODUCT_NOT_FOUND` (404), `ORDER_NOT_FOUND` (404), `DELIVERY_NOT_FOUND` (404)
- `CONFLICT_ERROR` (409)
- `INTERNAL_SERVER_ERROR` (500), `DATABASE_ERROR` (500)

---

## 🎭 Módulo de Mocking y Carga de Datos de Prueba (`/api/mocks`)

Genera datos simulados mediante **@faker-js/faker** respetando los modelos y constantes del sistema:

- `GET /api/mocks/users?qty=N` — Mocks de usuarios en memoria (default: 10, máx: 400).
- `GET /api/mocks/orders?qty=N` — Mocks de pedidos en memoria.
- `GET /api/mocks/deliveries?qty=N` — Mocks de entregas en memoria.
- `GET /api/mocks/all?qty=N` — Conjunto completo simulado en memoria.
- `POST /api/mocks/seed?qty=N&collection=...` — Carga controlada en MongoDB (`usuarios`, `pedidos`, `entregas`, `all`).

---

## 🚀 Cómo Levantar el Servidor

### Prerrequisitos
- **Node.js** (v18+)
- **MongoDB** ejecutándose localmente o URI de MongoDB Atlas

### Pasos de Instalación y Ejecución
1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Tiagopinfari/proyecto-ShipNow.git
   cd proyecto-ShipNow
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Crear un archivo `.env` en la raíz (podés basarte en `.env.example`):
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/shipnow
   JWT_SECRET=tu_clave_secreta_segura
   SHIPPING_API_KEY=shipnow_api_key_dev
   ```

4. **Levantar el servidor en modo desarrollo:**
   ```bash
   npm run dev
   ```

5. **Levantar el servidor en modo producción:**
   ```bash
   npm start
   ```

6. **Abrir Swagger UI en el navegador:**
   Visitar `http://localhost:3000/api/docs` para explorar y probar interactivamente todos los endpoints.

---

## 👨‍💻 Autor

- **Tiago Pinfari**
- **Curso:** Backend 3 — Coderhouse
- **Proyecto:** ShipNow API
