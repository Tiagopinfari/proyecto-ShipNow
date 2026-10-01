import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import config from './config/env.config.js';
import usersRouter from './routes/users.js';
import productsRouter from './routes/products.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    secret: config.JWT_SECRET
  });
});

app.use((req, res) => {
  res.status(404).send('Ruta no encontrada');
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
