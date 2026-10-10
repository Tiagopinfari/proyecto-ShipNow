import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import config from './config/env.config.js';
import usersRouter from './routes/users.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import deliveriesRouter from './routes/deliveries.js';
import mocksRouter from './routes/mocks.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/deliveries', deliveriesRouter);
app.use('/api/mocks', mocksRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    secret: config.JWT_SECRET
  });
});

app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Ruta no encontrada' });
});

// Middleware de manejo centralizado de errores
app.use((err, req, res, next) => {
  const isClientError = err.name === 'CastError' || err.name === 'ValidationError';
  const statusCode = err.statusCode || (isClientError ? 400 : 500);
  const message = err.name === 'CastError' ? 'ID inválido' : err.message;

  res.status(statusCode).json({
    status: 'error',
    message: message || 'Error interno del servidor'
  });
});

mongoose.connect(config.MONGODB_URI)
  .then(() => {
    app.listen(config.PORT, () => {
      console.log(`Servidor corriendo en modo ${config.NODE_ENV} en el puerto ${config.PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error de conexión a MongoDB:', error.message);
  });

export default app;
