# ShipNow API — Backend 3 (Coderhouse)

API RESTful profesional de logística para **ShipNow**, desarrollada bajo arquitectura en 3 capas (**Controller — Service — Repository**), validación estricta de variables de entorno al arranque, módulo de mocking con Faker, capa centralizada de manejo de errores y un **sistema profesional de logging y monitoreo básico con Winston** (Pre-entrega Módulo 4).

---

## 🏛️ Arquitectura del Sistema

El sistema implementa el patrón de capas desacopladas asegurando alta cohesión, testeabilidad, independencia de la base de datos y observabilidad completa mediante logs:

```text
[ Cliente HTTP ]
       │
       ▼
 [ httpLogger Middleware ] ──► Registra peticiones HTTP con Winston (método, URL, status, duración)
       │
       ▼
 [ Router ]                ──► Enrutamiento declarativo (asocia verbo/path al Controller)
       │
       ▼
[ Controller ]             ──► Manejo de req/res. Delega errores en next(error) sin emitir logs duplicados.
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

## 📝 Sistema de Logging Profesional (Pre-entrega Módulo 4)

La API cuenta con un logger centralizado implementado con **Winston** y rotación de archivos mediante **winston-daily-rotate-file**. Se eliminaron todos los `console.log` y `console.error` en favor de registros estructurados con niveles de criticidad.

### 📊 Niveles de Log Configurados

El sistema utiliza niveles jerárquicos donde a menor valor numérico, mayor es la criticidad:

| Nivel | Prioridad | Color | Uso en ShipNow API |
| :--- | :---: | :---: | :--- |
| **`fatal`** | 0 | Magenta | Errores críticos que impiden la operación (fallas de conexión inicial a MongoDB o arranque del servidor). |
| **`error`** | 1 | Rojo | Errores inesperados del servidor (errores 5xx, fallas de persistencia o excepciones no controladas). |
| **`warning`**| 2 | Amarillo | Advertencias y errores esperados del dominio/negocio (4xx: recurso no encontrado, validaciones, cantidades inválidas). |
| **`info`** | 3 | Azul | Eventos informativos clave (inicio del servidor, conexión a MongoDB, creación de entidades, seeds). |
| **`http`** | 4 | Verde | Registro de cada petición HTTP completada con status code y tiempo de respuesta en milisegundos. |
| **`debug`** | 5 | Cyan | Mensajes detallados para desarrollo y depuración granular. |

---

### 🌐 Comportamiento según el Entorno (`NODE_ENV`)

La configuración del logger se adapta dinámicamente según la variable `NODE_ENV` definida en `.env`:

1. **Entorno Desarrollo (`development`):**
   - **Consola:** Nivel `debug` (muestra absolutamente todos los niveles: `debug`, `http`, `info`, `warning`, `error`, `fatal`) con colores para facilitar la lectura durante el desarrollo.
   - **Archivos:** Registra errores y fallas críticas en `logs/error.log` y `logs/errors-%DATE%.log`.

2. **Entorno Producción (`production`):**
   - **Consola:** Nivel `info` (solo muestra `info`, `warning`, `error` y `fatal`; omite `debug` y `http` para optimizar rendimiento y no sobrecargar la salida).
   - **Archivos:** Persistencia estricta de errores con rotación.

---

### 💾 Persistencia y Rotación de Archivos de Logs

Los registros se almacenan dentro de la carpeta `/logs`:

1. **`logs/error.log`:** Archivo dedicado exclusivamente a los niveles **`error`** y **`fatal`** (no incluye `info`, `http`, `debug` ni `warning`). Posee rotación por tamaño límite de 5 MB y hasta 5 archivos históricos.
2. **`logs/errors-%DATE%.log`:** Archivo rotativo diario administrado por `winston-daily-rotate-file`, conservando un historial ordenado de hasta 14 días (`maxFiles: '14d'`).

#### 🔒 Exclusión en Git (`.gitignore`)
Para evitar que registros internos con información sensible o archivos gigantes se suban al repositorio, el archivo `.gitignore` excluye todos los archivos generados:
```gitignore
logs/*
!logs/.gitkeep
*.log
```
La carpeta `logs/` se mantiene versionada mediante un archivo `.gitkeep`, pero los archivos `.log` y archivos de auditoría nunca se suben a GitHub.

---

### 🧪 Endpoint de Prueba del Logger (`/api/loggerTest`)

Para verificar de forma inmediata el funcionamiento de todos los niveles del logger, se incorporó un endpoint de testing:

```http
GET /api/loggerTest
```
*(También disponible como alias en `GET /loggerTest`)*

#### Salida esperada en Consola:
```text
2026-10-24 15:29:37 [debug] Mensaje de prueba - nivel DEBUG
2026-10-24 15:29:37 [http] GET /api/loggerTest 200 - 5ms
2026-10-24 15:29:37 [info] Mensaje de prueba - nivel INFO
2026-10-24 15:29:37 [warning] Mensaje de prueba - nivel WARNING
2026-10-24 15:29:37 [error] Mensaje de prueba - nivel ERROR
2026-10-24 15:29:37 [fatal] Mensaje de prueba - nivel FATAL
```

#### Salida en `logs/error.log` y `logs/errors-YYYY-MM-DD.log`:
Únicamente se guardan las líneas de niveles `error` y `fatal`:
```text
2026-10-24 15:29:37 [error] Mensaje de prueba - nivel ERROR
2026-10-24 15:29:37 [fatal] Mensaje de prueba - nivel FATAL
```

#### Respuesta HTTP al Cliente:
```json
{
  "status": "success",
  "message": "Logs de prueba ejecutados correctamente en todos los niveles (debug, http, info, warning, error, fatal)",
  "levelsTested": ["debug", "http", "info", "warning", "error", "fatal"]
}
```

---

## 🛡️ Capa Centralizada de Gestión Profesional de Errores

Todos los errores del sistema responden bajo un esquema JSON uniforme:
```json
{
  "status": "error",
  "message": "Descripción clara del problema",
  "code": "CODIGO_ESTANDARIZADO"
}
```

- **Errores de negocio (4xx):** Se registran con nivel **`warning`** en el logger (ej. `USER_NOT_FOUND`, `VALIDATION_ERROR`, `ROUTE_NOT_FOUND`, `INVALID_QUANTITY`).
- **Errores de servidor (5xx):** Se registran con nivel **`error`** en el logger e impactan en los archivos `logs/error.log` y `logs/errors-YYYY-MM-DD.log`.

---

## 🎭 Módulo de Mocking y Carga de Datos de Prueba (`/api/mocks`)

Genera datos simulados mediante **@faker-js/faker** con campos unificados con el modelo real (`firstName`, `lastName`, `email`, `role`, `password`):

- `GET /api/mocks/users?qty=N` — Mocks de usuarios en memoria (default: 10, máx: 400).
- `GET /api/mocks/orders?qty=N` — Mocks de pedidos en memoria.
- `GET /api/mocks/deliveries?qty=N` — Mocks de entregas en memoria.
- `GET /api/mocks/all?qty=N` — Conjunto completo simulado en memoria.
- `POST /api/mocks/seed?qty=N&collection=...` — Carga en MongoDB (`usuarios`, `pedidos`, `entregas`, `all`).

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

### Health & Monitoreo
- `GET /api/health` — Estado general de la API, timestamp y entorno.
- `GET /api/loggerTest` — Endpoint de prueba del logger en todos los niveles.

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
- `GET /api/products` — Listar productos disponibles.
- `GET /api/products/:id` — Obtener producto por ID.
- `POST /api/products` — Crear producto.
- `PUT /api/products/:id` — Actualizar producto.
- `DELETE /api/products/:id` — Eliminar producto.

---

## 👨‍💻 Autor

- **Tiago Pinfari**
- **Curso:** Backend 3 — Coderhouse
- **Proyecto:** ShipNow API
