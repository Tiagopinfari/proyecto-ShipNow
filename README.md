# ShipNow API — Pre-entrega Módulo 1: Arquitectura Profesional en 3 Capas

API RESTful refactorizada para el curso **Backend 3 (Coderhouse)**, adoptando una arquitectura en capas desacoplada (**Controller — Service — Repository**), validación estricta de variables de entorno al arranque y centralización de constantes del dominio.

---

## 🏛️ Arquitectura del Proyecto

El sistema aplica el patrón de diseño en capas para asegurar alta cohesión, bajo acoplamiento y testeabilidad:

```text
[ Cliente HTTP ]
       │
       ▼
 [ Router ]          ──> Enrutamiento mínimo (asocia ruta HTTP con método del Controller)
       │
       ▼
[ Controller ]       ──> Entrada/salida HTTP (gestión de req, res y status codes). NUNCA accede a la BD.
       │
       ▼
 [ Service ]         ──> Lógica de negocio, reglas de dominio, validaciones y cálculos.
       │
       ▼
[ Repository ]       ──> Único punto de acceso y persistencia hacia Mongoose / MongoDB.
       │
       ▼
  [ Model ]          ──> Esquemas y modelos puros de Mongoose sin lógica de negocio.
```

### 📂 Estructura de Directorios

```text
src/
├── config/
│   ├── env.config.js      # Carga y validación estricta de variables de entorno al arranque
│   └── index.js           # Re-exportación centralizada de configuración
├── constants/
│   └── index.js           # Constantes inmutables del dominio (Object.freeze: estados, roles, HTTP)
├── controllers/
│   ├── product.controller.js  # Manejador HTTP de endpoints de productos
│   └── user.controller.js     # Manejador HTTP de endpoints de usuarios
├── models/
│   ├── product.model.js       # Esquema Mongoose de Producto
│   └── user.model.js          # Esquema Mongoose de Usuario
├── repositories/
│   ├── product.repository.js  # Capa de datos y consultas para productos
│   └── user.repository.js     # Capa de datos y consultas para usuarios
├── routes/
│   ├── products.js            # Enrutador mínimo de productos
│   └── users.js               # Enrutador mínimo de usuarios
├── services/
│   ├── product.service.js     # Lógica de negocio y cotización de envíos
│   └── user.service.js        # Lógica de negocio y reglas de creación de usuarios
├── utils/
│   └── constants.js           # Exportación compatible de constantes
└── server.js                  # Inicialización y arranque del servidor Express
```

---

## 💡 Justificación: Separación entre Service y Repository

En el desarrollo de software profesional, la separación entre **Service** y **Repository** responde al **Principio de Responsabilidad Única (SRP)** y a la inversión de dependencias:

1. **¿Qué hace el Repository?**
   - Es el **único componente del sistema que conoce el ORM/ODM (Mongoose)** y la tecnología de base de datos.
   - **No es un simple "pasamanos"**: encapsula proyecciones, ordenamientos por defecto, filtros comunes (por ejemplo, `findAvailable()`), y optimizaciones de consulta.
   - Si mañana se decide migrar de MongoDB a PostgreSQL o DynamoDB, **solo se reemplaza o adapta el Repository**, sin modificar una sola línea de la lógica de negocio ni de los controladores.

2. **¿Qué hace el Service?**
   - Contiene **toda la lógica y las reglas de negocio del dominio**:
     - Validación de que un producto tenga precio no negativo y código único antes de persistir.
     - Determinación automática del estado (`available` vs `out_of_stock`) según el stock ingresado.
     - Reglas de seguridad: impedir que se creen usuarios administradores (`role: 'admin'`) desde el endpoint público de registro.
     - Cálculo y cotización dinámica de costos de envío (`calculateShippingCost`) basándose en el entorno (`development` vs `production`).
     - Orquestación de servicios externos (ej. envío simulado de notificaciones por email).
   - El Service no sabe si los datos provienen de MongoDB, Redis o una API externa; trabaja exclusivamente con entidades y reglas de negocio.

3. **¿Por qué el Controller no accede al Repository?**
   - El Controller es exclusivamente un adaptador de transporte (HTTP): extrae parámetros de la petición (`req.params`, `req.body`, `req.query`), delega la operación al Service y devuelve la respuesta HTTP adecuada (`200`, `201`, `400`, `403`, `404`, `500`). Mantenerlo desacoplado de la base de datos garantiza que la misma lógica de negocio pueda exponerse a través de REST, GraphQL, WebSockets o tareas en segundo plano.

---

## ⚙️ Configuración y Variables de Entorno

La configuración está centralizada en `src/config/env.config.js` y cuenta con **validación estricta al arranque**. Si falta alguna variable obligatoria (`PORT`, `MONGODB_URI`, `NODE_ENV`), la aplicación aborta su ejecución arrojando un error descriptivo:

```text
[ERROR DE CONFIGURACIÓN] Faltan variables de entorno críticas requeridas: MONGODB_URI. La aplicación no puede iniciar sin esta configuración.
```

### Archivo `.env.example`

Se incluye el archivo `.env.example` con las claves necesarias sin exponer secretos:

```env
# Configuración de Entorno y Servidor
PORT=8080
NODE_ENV=development

# Base de Datos MongoDB
MONGODB_URI=mongodb://localhost:27017/tu_base_de_datos

# Seguridad y Servicios Externos
JWT_SECRET=tu_clave_secreta_jwt
SHIPPING_API_KEY=tu_shipping_api_key
```

> **Nota de seguridad:** El archivo `.env` real está incluido en el `.gitignore` y nunca se sube al repositorio.

---

## 🔒 Centralización de Constantes

Se eliminaron los "magic strings" y se definieron objetos inmutables mediante `Object.freeze` en `src/constants/index.js`:

- **Estados de Producto (`PRODUCT_STATUS`):**
  - `AVAILABLE`: `'available'`
  - `OUT_OF_STOCK`: `'out_of_stock'`
- **Roles de Usuario (`USER_ROLES`):**
  - `ADMIN`: `'admin'`
  - `USER`: `'user'`
- **Códigos de Estado HTTP (`HTTP_STATUS`):**
  - Centralización de `OK (200)`, `CREATED (201)`, `BAD_REQUEST (400)`, `FORBIDDEN (403)`, `NOT_FOUND (404)`, `INTERNAL_SERVER_ERROR (500)`.

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos

- **Node.js** (versión 18 o superior)
- **MongoDB** en ejecución local o una instancia en la nube (MongoDB Atlas)

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Tiagopinfari/proyecto-backend-III.git
   cd proyecto-backend-III
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar el archivo de entorno:**
   Copia el archivo de ejemplo y completa los valores correspondientes:
   ```bash
   cp .env.example .env
   ```

   Ejemplo de contenido para `.env`:
   ```env
   PORT=8080
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/shipnow
   JWT_SECRET=mi_clave_secreta
   SHIPPING_API_KEY=shipnow_shipping_key_123
   ```

4. **Ejecutar en modo desarrollo:**
   ```bash
   npm run dev
   ```

5. **Ejecutar en modo producción:**
   ```bash
   npm start
   ```

---

## 📡 Endpoints de la API

### Health Check

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Chequeo de estado del servicio, entorno y timestamp |

---

### Productos (`/api/products`)

| Método | Endpoint | Descripción | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Lista productos con stock disponible (`?all=true` incluye sin stock) | `200`, `500` |
| `GET` | `/api/products/:id` | Obtiene detalle de un producto por ID | `200`, `404`, `500` |
| `GET` | `/api/products/:id/shipping-cost` | Cotiza el envío del producto según el entorno | `200`, `404`, `500` |
| `POST` | `/api/products` | Crea un nuevo producto validando campos obligatorios y unicidad de código | `201`, `400`, `500` |
| `PUT` | `/api/products/:id` | Actualiza un producto y sincroniza el estado según el stock | `200`, `400`, `404`, `500` |
| `DELETE` | `/api/products/:id` | Elimina un producto por ID | `200`, `404`, `500` |

#### Ejemplo POST `/api/products`:
```json
{
  "title": "Auriculares Inalámbricos Pro",
  "code": "AUR-PRO-01",
  "price": 25000,
  "stock": 15,
  "category": "audio",
  "description": "Auriculares con cancelación de ruido activa"
}
```

---

### Usuarios (`/api/users`)

| Método | Endpoint | Descripción | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | Lista todos los usuarios registrados | `200`, `500` |
| `GET` | `/api/users/:id` | Obtiene detalle de un usuario por ID | `200`, `404`, `500` |
| `POST` | `/api/users` | Registra un usuario (impide creación de `role: 'admin'`) | `201`, `400`, `403`, `500` |
| `PUT` | `/api/users/:id` | Actualiza datos de un usuario por ID | `200`, `404`, `500` |
| `DELETE` | `/api/users/:id` | Elimina un usuario por ID | `200`, `404`, `500` |

#### Ejemplo POST `/api/users`:
```json
{
  "firstName": "Tiago",
  "lastName": "Pérez",
  "email": "tiago@example.com",
  "password": "PasswordSeguro123!"
}
```

---

## 👨‍💻 Autor

- **Curso:** Backend 3 — Coderhouse
- **Proyecto:** ShipNow API
