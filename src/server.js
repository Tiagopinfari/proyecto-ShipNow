import mongoose from 'mongoose';
import app from './app.js';
import config from './config/env.config.js';
import logger from './config/logger.js';

export const startServer = async () => {
  const server = app.listen(config.PORT, () => {
    logger.info(`Servidor ShipNow escuchando en el puerto ${config.PORT} (modo ${config.NODE_ENV})`);
    logger.info(`Documentación Swagger UI disponible en http://localhost:${config.PORT}/api/docs`);
  });

  try {
    await mongoose.connect(config.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    logger.info('Conexión a MongoDB establecida exitosamente');
  } catch (error) {
    logger.fatal(`Error crítico al conectar con MongoDB: ${error.message}`);
  }

  return server;
};

if (!config.isTest) {
  startServer();
}

export default app;
