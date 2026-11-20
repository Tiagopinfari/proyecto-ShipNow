import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import config from './config/env.config.js';
import { swaggerSpec, swaggerUiOptions } from './config/swagger.js';
import httpLogger from './middlewares/httpLogger.js';
import { internalEndpointGuard, swaggerProdGuard } from './middlewares/internalEndpointGuard.js';
import usersRouter from './routes/users.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import deliveriesRouter from './routes/deliveries.js';
import mocksRouter from './routes/mocks.js';
import loggerTestRouter from './routes/loggerTest.router.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';

const app = express();

app.use(cors());
// Límite explícito de payload JSON/URL-encoded para evitar payloads excesivos que degraden el Event Loop
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Middleware de registro de peticiones HTTP
app.use(httpLogger);

// Documentación interactiva con Swagger / OpenAPI (protegida en producción según criterio ENABLE_SWAGGER_IN_PROD)
app.get('/api/docs.json', swaggerProdGuard, (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
app.use('/api/docs', swaggerProdGuard, swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Rutas principales de negocio de la API
app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/deliveries', deliveriesRouter);

// Endpoints de herramientas internas (Mocks y LoggerTest):
// Activos en development/test; restringidos en production salvo ENABLE_INTERNAL_ENDPOINTS_IN_PROD=true
app.use('/api/mocks', internalEndpointGuard, mocksRouter);
app.use('/api/loggerTest', internalEndpointGuard, loggerTestRouter);
app.use('/loggerTest', internalEndpointGuard, loggerTestRouter);

// Health check seguro (estado de la API, entorno, uptime y timestamp — SIN exponer secretos ni datos sensibles)
const healthCheckHandler = (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV || config.NODE_ENV,
    uptime: Number(process.uptime().toFixed(2)),
    timestamp: new Date().toISOString()
  });
};

app.get('/api/health', healthCheckHandler);
app.get('/health', healthCheckHandler);

// Middleware para rutas no encontradas (404)
app.use(notFoundHandler);

// Middleware global de manejo uniforme de errores
app.use(errorHandler);

export default app;
