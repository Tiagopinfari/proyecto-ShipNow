import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import config from './config/env.config.js';
import { swaggerSpec, swaggerUiOptions } from './config/swagger.js';
import httpLogger from './middlewares/httpLogger.js';
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de registro de peticiones HTTP
app.use(httpLogger);

// Documentación interactiva con Swagger / OpenAPI
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Rutas principales de la API
app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/deliveries', deliveriesRouter);
app.use('/api/mocks', mocksRouter);

// Endpoint de prueba del logger (accesible vía /api/loggerTest y su alias /loggerTest)
app.use('/api/loggerTest', loggerTestRouter);
app.use('/loggerTest', loggerTestRouter);

// Health check (accesible vía /api/health y su alias /health)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    secret: config.JWT_SECRET
  });
});
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  });
});

// Middleware para rutas no encontradas (404)
app.use(notFoundHandler);

// Middleware global de manejo uniforme de errores
app.use(errorHandler);

export default app;
