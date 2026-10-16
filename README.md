# ShipNow API — Backend 3 (Coderhouse)

API RESTful profesional de logística para **ShipNow**, desarrollada bajo arquitectura en 3 capas (**Controller — Service — Repository**), validación estricta de variables de entorno al arranque, módulo de mocking con Faker y una **capa centralizada de gestión profesional de errores** (Pre-entrega Módulo 3).

---

## 🏛️ Arquitectura del Sistema

El sistema implementa el patrón de capas desacopladas asegurando alta cohesión, testeabilidad, independencia de la base de datos y tratamiento uniforme de errores:

```text
[ Cliente HTTP ]
       │
       ▼
 [ Router ]          ──> Enrutamiento declarativo (asocia verbo/path al Controller)
       │
       ▼
[ Controller ]       ──> Manejo de req/res. NO genera respuestas de error: delega en next(error).
       │
       ▼
 [ Service ]         ──> Reglas de negocio. Detecta y arroja Errores Personalizados del Dominio.
       │
       ├───► [ Mocks Generator (Faker) ] ──> Generación de datos simulados en memoria.
       │
       ▼
[ Repository ]       ──> Único componente que interactúa con Mongoose / MongoDB.
       │
       ▼
  [ Model ]          ──> Esquemas de datos Mongoose con validaciones nativas.

─────────────────────────────────────────────────────────────────────────────
[ CAPA CENTRALIZADA DE ERRORES ]
─────────────────────────────────────────────────────────────────────────────
notFoundHandler (404) ──► errorHandler (Middleware Global) ──► Respuesta Uniforme
       ▲
       │ (next(error))
Services / Controllers ──► Error Personalizado + Diccionario (ERROR_CODES / DICTIONARY)
```

### 📂 Estructura de Directorios

```text
src/
├── config/
│   ├── env.config.js          # Carga y validación estricta de variables de entorno al arranque
│   └── index.js               # Re-exportación de configuración
├── constants/
│   └── index.js               # Constantes inmutables congeladas con Object.freeze
├── controllers/
│   ├── delivery.controller.js # Manejador HTTP de entregas (delega errores a next)
│   ├── mock.controller.js     # Manejador HTTP de mocks y seed (delega errores a next)
│   ├── order.controller.js    # Manejador HTTP de pedidos (delega errores a next)
│   ├── product.controller.js  # Manejador HTTP de productos (delega errores a next)
│   └── user.controller.js     # Manejador HTTP de usuarios (delega errores a next)
├── middlewares/
│   ├── errorHandler.js        # Middleware global: transforma errores a respuestas HTTP uniformes
│   └── notFoundHandler.js     # Captura rutas no existentes y genera RouteNotFoundError
├── mocks/
│   ├── delivery.mock.js       # Generador de entregas simuladas
│   ├── order.mock.js          # Generador de pedidos simulados
│   └── user.mock.js           # Generador de usuarios simulados con campos reales del modelo
├── models/
│   ├── delivery.model.js      # Esquema Mongoose de Entrega
│   ├── order.model.js         # Esquema Mongoose de Pedido
│   ├── product.model.js       # Esquema Mongoose de Producto
│   └── user.model.js          # Esquema Mongoose de Usuario
├── repositories/
│   ├── delivery.repository.js # Capa de datos para entregas
│   ├── order.repository.js    # Capa de datos para pedidos
│   ├── product.repository.js  # Capa de datos para productos
│   └── user.repository.js     # Capa de datos para usuarios
├── routes/
│   ├── deliveries.js          # Enrutador de entregas
│   ├── mocks.js               # Enrutador de mocking y seed (/api/mocks)
│   ├── orders.js              # Enrutador de pedidos
│   ├── products.js            # Enrutador de productos
│   └── users.js               # Enrutador de usuarios
├── services/
│   ├── delivery.service.js    # Lógica de entregas y validación de drivers
│   ├── mocks.service.js       # Lógica de mocking y control de inserción
│   ├── order.service.js       # Lógica de pedidos y cálculo de envíos
│   ├── product.service.js     # Lógica de productos
│   └── user.service.js        # Lógica de usuarios y restricciones de roles
├── utils/
│   ├── apiResponse.js         # Funciones helper para respuestas y creación de errores
│   ├── errorDictionary.js     # Diccionario central de códigos y mensajes estándar
│   └── errors.js              # Jerarquía de clases de errores personalizados del dominio
└── server.js                  # Inicialización del servidor, rutas y middlewares de errores
```

---

## 🛡️ Capa Centralizada de Gestión Profesional de Errores (Pre-entrega Módulo 3)

La API cuenta con una capa unificada para la gestión de errores que elimina respuestas dispersas en rutas o controladores:

1. **Detección temprana en la capa de Services:** Los servicios evalúan las condiciones del negocio y lanzan **Errores Personalizados del Dominio** tipados.
2. **Controladores limpios:** Cada método captura cualquier excepción en su bloque `catch` y la pasa directamente al middleware con `next(error)`. NINGÚN controlador responde errores de forma aislada.
3. **Middleware Global (`errorHandler.js`):** Punto único de salida de errores hacia el cliente. Identifica errores del dominio, errores nativos de Mongoose (`CastError`, `ValidationError`, clave duplicada `11000`) y errores inesperados, traduciéndolos a una respuesta predecible.
4. **Middleware de Rutas No Encontradas (`notFoundHandler.js`):** Captura accesos a endpoints inexistentes y deriva a `errorHandler` con código `ROUTE_NOT_FOUND`.

### 📋 Estructura Uniforme de Respuesta de Error

Todos los errores del sistema responden bajo el siguiente esquema JSON predecible:

```json
{
  "status": "error",
  "message": "Descripción clara del problema",
  "code": "CODIGO_ESTANDARIZADO"
}
```

Si existen detalles adicionales de validación, se incluye opcionalmente el campo `details`.

---

### 📖 Diccionario de Errores (`src/utils/errorDictionary.js`)

Define las constantes de códigos (`ERROR_CODES`) y su configuración predeterminada de códigos HTTP y mensajes (`ERROR_DICTIONARY`):

| Código (`code`) | HTTP Status | Mensaje por Defecto | Caso de Uso |
| :--- | :---: | :--- | :--- |
| `USER_NOT_FOUND` | 404 | Usuario no encontrado | Búsqueda/actualización/eliminación de usuario inexistente |
| `PRODUCT_NOT_FOUND` | 404 | Producto no encontrado | Consulta o modificación de producto inexistente |
| `ORDER_NOT_FOUND` | 404 | Pedido no encontrado | Pedido no hallado por ID |
| `DELIVERY_NOT_FOUND` | 404 | Entrega no encontrada | Entrega no hallada por ID |
| `ROUTE_NOT_FOUND` | 404 | Ruta no encontrada | Endpoint o método HTTP no implementado |
| `VALIDATION_ERROR` | 400 | Faltan datos obligatorios o formato inválido | Faltan campos en body o formato de ID inválido |
| `INVALID_QUANTITY` | 400 | Cantidad de datos inválida | Parámetro `qty` inválido en el módulo de mocks |
| `INVALID_USER_ROLE` | 400 | Rol de usuario inválido | Rol desconocido o asignación de driver incorrecta |
| `INVALID_STATUS` | 400 | Estado o prioridad inválidos | Estado o prioridad fuera de los `enum` permitidos |
| `CONFLICT_ERROR` | 409 | El recurso ya existe o genera conflicto | Email duplicado, código de producto repetido |
| `FORBIDDEN_OPERATION` | 403 | Operación no permitida | Intento de registrar usuarios con rol ADMIN desde endpoint público |
| `DATABASE_ERROR` | 500 | Error al operar con la base de datos | Fallas de conexión o inserción en MongoDB |
| `INTERNAL_SERVER_ERROR` | 500 | Error interno en el servidor | Errores no contemplados o fallas críticas |

---

### 🧱 Clases de Errores Personalizados del Dominio (`src/utils/errors.js`)

Heredan de la clase base `CustomError` que extiende la clase nativa `Error` de JavaScript:

- `UserNotFoundError` (404)
- `ProductNotFoundError` (404)
- `OrderNotFoundError` (404)
- `DeliveryNotFoundError` (404)
- `RouteNotFoundError` (404)
- `ValidationError` (400)
- `InvalidQuantityError` (400)
- `InvalidRoleError` (400)
- `InvalidStatusError` (400)
- `ConflictError` (409)
- `ForbiddenError` (403)
- `DatabaseOperationError` (500)

---

## 🎭 Módulo de Mocking y Carga de Datos de Prueba (Integrado con Errores Centralizados)

Genera datos simulados mediante **@faker-js/faker** con campos unificados con el modelo real (`firstName`, `lastName`, `email`, `role`, `password`) y validaciones controladas:

### 🔌 Endpoints de Mocking (`/api/mocks`)

| Método | Endpoint | Parámetros | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/mocks/users` | `?qty=N` (default: 10, máx: 400) | Devuelve usuarios simulados en memoria con campos reales del modelo |
| `GET` | `/api/mocks/orders` | `?qty=N` (default: 10, máx: 400) | Devuelve pedidos simulados en memoria |
| `GET` | `/api/mocks/deliveries` | `?qty=N` (default: 10, máx: 400) | Devuelve entregas simuladas en memoria |
| `GET` | `/api/mocks/all` | `?qty=N` (default: 10, máx: 400) | Devuelve un conjunto completo simulado en memoria |
| `POST` | `/api/mocks/seed` | `?qty=N&collection=...` | Inserta datos de prueba en MongoDB respetando relaciones |

### Respuestas de Error Controladas en Mocks:

1. **Cantidad no numérica o decimal (`?qty=abc` o `?qty=2.5`):**
   ```json
   {
     "status": "error",
     "message": "qty debe ser un número entero válido",
     "code": "INVALID_QUANTITY"
   }
   ```
2. **Valor negativo (`?qty=-5`):**
   ```json
   {
     "status": "error",
     "message": "qty no puede ser negativo",
     "code": "INVALID_QUANTITY"
   }
   ```
3. **Cantidad excesiva (`?qty=450`):**
   ```json
   {
     "status": "error",
     "message": "qty no puede superar 400",
     "code": "INVALID_QUANTITY"
   }
   ```
4. **Fallas durante la carga en MongoDB:**
   Si la base de datos pierde conexión o falla en la inserción, se captura de forma controlada respondiendo con status **500** y código `DATABASE_ERROR`.

---

## 🔒 Constantes Inmutables del Dominio

Todas las constantes se encuentran centralizadas en `src/constants/index.js` y congeladas con `Object.freeze`:

- **Roles de Usuario (`USER_ROLES`):** `ADMIN`, `CUSTOMER`, `DRIVER`, `STORE`, `USER`.
- **Estados de Pedido (`ORDER_STATUS`):** `CREATED`, `ASSIGNED`, `PICKED_UP`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`.
- **Estados de Entrega (`DELIVERY_STATUS`):** `PENDING`, `ASSIGNED`, `IN_TRANSIT`, `DELIVERED`.
- **Prioridades (`DELIVERY_PRIORITY`):** `LOW`, `NORMAL`, `HIGH`.
- **Estados de Producto (`PRODUCT_STATUS`):** `AVAILABLE`, `OUT_OF_STOCK`.
- **Códigos HTTP (`HTTP_STATUS`):** `OK`, `CREATED`, `BAD_REQUEST`, `FORBIDDEN`, `NOT_FOUND`, `INTERNAL_SERVER_ERROR`.

---

## ⚙️ Configuración y Variables de Entorno

La configuración está centralizada en `src/config/env.config.js` con **validación estricta al arranque**. Si falta alguna variable obligatoria (`PORT`, `MONGODB_URI`, `NODE_ENV`), la aplicación aborta inmediatamente con un error descriptivo:

```text
[ERROR DE CONFIGURACIÓN] Faltan variables de entorno críticas requeridas: MONGODB_URI. La aplicación no puede iniciar sin esta configuración.
```

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
- **Node.js** (v18+)
- **MongoDB** local o Atlas

### Pasos
1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Tiagopinfari/proyecto-ShipNow.git
   cd proyecto-ShipNow
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar el archivo de entorno:**
   ```bash
   cp .env.example .env
   ```

4. **Iniciar en modo desarrollo:**
   ```bash
   npm run dev
   ```

5. **Iniciar en modo producción:**
   ```bash
   npm start
   ```

---

## 👨‍💻 Autor

- **Tiago Pinfari**
- **Curso:** Backend 3 — Coderhouse
- **Proyecto:** ShipNow API
