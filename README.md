# ShipNow API — Backend 3 (Coderhouse)

API RESTful modular de logística para **ShipNow**, desarrollada bajo arquitectura profesional en 3 capas (**Controller — Service — Repository**), validación estricta de entorno y un completo **módulo de mocking y seeding de datos de prueba** con Faker.

---

## 🏛️ Arquitectura del Sistema

El sistema implementa el patrón de capas desacopladas asegurando alta cohesión, testeabilidad e independencia de la base de datos:

```text
[ Cliente HTTP ]
       │
       ▼
 [ Router ]          ──> Enrutamiento declarativo (asocia verbo/path al Controller)
       │
       ▼
[ Controller ]       ──> Manejo de req/res, parámetros y status codes. NUNCA accede a MongoDB.
       │
       ▼
 [ Service ]         ──> Reglas de negocio, validaciones, orquestación y lógica de mocks.
       │
       ├───► [ Mocks Generator (Faker) ] ──> Funciones puras que generan datos simulados en memoria.
       │
       ▼
[ Repository ]       ──> Único componente que interactúa con Mongoose / MongoDB.
       │
       ▼
  [ Model ]          ──> Esquemas de datos Mongoose con validaciones nativas y constantes.
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
│   ├── delivery.controller.js # Manejador HTTP de entregas
│   ├── mock.controller.js     # Manejador HTTP de endpoints de mocks y seed
│   ├── order.controller.js    # Manejador HTTP de pedidos
│   ├── product.controller.js  # Manejador HTTP de productos
│   └── user.controller.js     # Manejador HTTP de usuarios
├── mocks/
│   ├── delivery.mock.js       # Generador de entregas simuladas
│   ├── order.mock.js          # Generador de pedidos simulados
│   └── user.mock.js           # Generador de usuarios y repartidores simulados con Faker
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
│   ├── delivery.service.js    # Lógica de negocio de entregas
│   ├── mocks.service.js       # Lógica de mocking y control de inserción (seed)
│   ├── order.service.js       # Lógica de negocio y cálculo de envíos
│   ├── product.service.js     # Lógica de negocio de productos
│   └── user.service.js        # Lógica de negocio de usuarios
├── utils/
│   ├── constants.js           # Constantes del dominio
│   └── errors.js              # Clase AppError con código HTTP
└── server.js                  # Inicialización y arranque del servidor Express
```

---

## 🎭 Módulo de Mocking y Carga de Datos de Prueba (Pre-entrega Módulo 2)

El módulo de mocking permite generar datos simulados realistas (**usuarios, repartidores, pedidos y entregas**) mediante **@faker-js/faker** sin depender de registros manuales y manteniendo estricta coherencia entre modelos y relaciones.

### 🔌 Endpoints de Mocking (`/api/mocks`)

| Método | Endpoint | Parámetros | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/mocks/users` | `?qty=N` (default: 10, máx: 400) | Devuelve usuarios simulados **en memoria** (sin guardarlos en BD) |
| `GET` | `/api/mocks/orders` | `?qty=N` (default: 10, máx: 400) | Devuelve pedidos simulados en memoria |
| `GET` | `/api/mocks/deliveries` | `?qty=N` (default: 10, máx: 400) | Devuelve entregas simuladas en memoria |
| `GET` | `/api/mocks/all` | `?qty=N` (default: 10, máx: 400) | Devuelve un conjunto completo simulado en memoria |
| `POST` | `/api/mocks/seed` | `?qty=N&collection=...` o en body | Inserta datos de prueba en MongoDB de forma controlada |

---

### 1. Obtención de Mocks en Memoria (Sin Guardar)

#### `GET /api/mocks/users?qty=2`
Devuelve usuarios de prueba (clientes y repartidores) con datos realistas generados al vuelo:

```json
[
  {
    "nombre": "Ana Pérez",
    "email": "ana.perez.8k12a@shipnow.test",
    "rol": "cliente"
  },
  {
    "nombre": "Luis Gómez",
    "email": "luis.gomez.9f33b@shipnow.test",
    "rol": "repartidor"
  }
]
```

#### `GET /api/mocks/orders?qty=2`
Devuelve pedidos simulados respetando items, precios positivos, dirección de entrega, totales y estados permitidos:

```json
[
  {
    "customer": "651f8a...",
    "items": [
      { "name": "Caja de embalaje", "quantity": 2, "price": 1500 }
    ],
    "deliveryAddress": "Av. Corrientes 1234, CABA",
    "declaredValue": 3000,
    "shippingCost": 10,
    "total": 3010,
    "status": "created",
    "priority": "normal"
  }
]
```

---

### 2. Carga de Datos de Prueba en Base de Datos (`POST /api/mocks/seed`)

Inserta registros de prueba en MongoDB de forma controlada, validando esquemas y manteniendo las relaciones entre entidades.

#### Opciones de colección soportadas (`collection` o `coleccion` por query o body):
- `usuarios` (por defecto): Genera e inserta usuarios y repartidores.
- `pedidos`: Genera clientes y les crea pedidos vinculados.
- `entregas`: Genera clientes, repartidores, pedidos y crea entregas vinculadas.
- `all` / `completo`: Genera e inserta la cadena completa interrelacionada.

#### Ejemplo 1: Carga de usuarios (Ejemplo del Briefing)
```bash
POST /api/mocks/seed?qty=10
```
Respuesta:
```json
{
  "insertados": 10,
  "coleccion": "usuarios"
}
```

#### Ejemplo 2: Carga de pedidos
```bash
POST /api/mocks/seed?qty=5&collection=pedidos
```
Respuesta:
```json
{
  "insertados": 5,
  "coleccion": "pedidos"
}
```

#### Validaciones del endpoint de Seed:
- `qty` debe ser un número entero mayor a 0 y menor o igual a 400.
- Si se envía un valor inválido (ej. `?qty=-1`, `?qty=abc` o `?qty=401`), la API responde con status **400 Bad Request** y un mensaje descriptivo.

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

La configuración está centralizada en `src/config/env.config.js` con **validación estricta al arranque**. Si falta alguna variable requerida (`PORT`, `MONGODB_URI`, `NODE_ENV`), la aplicación aborta inmediatamente con un error claro:

```text
[ERROR DE CONFIGURACIÓN] Faltan variables de entorno críticas requeridas: MONGODB_URI. La aplicación no puede iniciar sin esta configuración.
```

### Archivo `.env.example`

```env
# Entorno y Servidor
PORT=8080
NODE_ENV=development

# Base de Datos MongoDB
MONGODB_URI=mongodb://localhost:27017/tu_base_de_datos

# Seguridad y Servicios Externos
JWT_SECRET=tu_clave_secreta_jwt
SHIPPING_API_KEY=tu_shipping_api_key
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

## 📡 Tabla General de Endpoints

### Health Check
- `GET /api/health` — Estado general de la API y timestamp.

### Mocks (`/api/mocks`)
- `GET /api/mocks/users?qty=2` — Mocks de usuarios en memoria.
- `GET /api/mocks/orders?qty=2` — Mocks de pedidos en memoria.
- `GET /api/mocks/deliveries?qty=2` — Mocks de entregas en memoria.
- `GET /api/mocks/all?qty=5` — Mocks de usuarios, pedidos y entregas en memoria.
- `POST /api/mocks/seed?qty=10` — Inserción controlada en MongoDB (`usuarios`, `pedidos`, `entregas`, `all`).

### Usuarios (`/api/users`)
- `GET /api/users` — Listar usuarios.
- `GET /api/users/:id` — Obtener usuario por ID.
- `POST /api/users` — Crear usuario.
- `PUT /api/users/:id` — Actualizar usuario.
- `DELETE /api/users/:id` — Eliminar usuario.

### Pedidos (`/api/orders`)
- `GET /api/orders` — Listar pedidos con clientes poblados.
- `GET /api/orders/:id` — Obtener pedido por ID.
- `POST /api/orders` — Crear pedido (calcula envío y total).
- `PUT /api/orders/:id` — Actualizar pedido.
- `DELETE /api/orders/:id` — Eliminar pedido.

### Entregas (`/api/deliveries`)
- `GET /api/deliveries` — Listar entregas con pedidos y repartidores.
- `GET /api/deliveries/:id` — Obtener entrega por ID.
- `POST /api/deliveries` — Crear entrega vinculada a pedido y repartidor.
- `PUT /api/deliveries/:id` — Actualizar entrega.
- `DELETE /api/deliveries/:id` — Eliminar entrega.

### Productos (`/api/products`)
- `GET /api/products` — Listar productos disponibles (`?all=true` incluye sin stock).
- `GET /api/products/:id` — Obtener producto por ID.
- `GET /api/products/:id/shipping-cost` — Cotizar costo de envío.
- `POST /api/products` — Crear producto.
- `PUT /api/products/:id` — Actualizar producto.
- `DELETE /api/products/:id` — Eliminar producto.

---

## 👨‍💻 Autor

- **Tiago Pinfari**
- **Curso:** Backend 3 — Coderhouse
- **Proyecto:** ShipNow API
