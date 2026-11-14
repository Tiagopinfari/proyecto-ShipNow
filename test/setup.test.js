import mongoose from 'mongoose';
import config from '../src/config/env.config.js';
import logger from '../src/config/logger.js';
import User from '../src/models/user.model.js';
import Order from '../src/models/order.model.js';
import Delivery from '../src/models/delivery.model.js';
import Product from '../src/models/product.model.js';
import { enableInMemoryTestPersistence, clearMemoryStores } from './inMemoryPersistence.js';

let usingInMemoryFallback = false;

export const clearTestDatabase = async () => {
  if (usingInMemoryFallback) {
    clearMemoryStores();
    return;
  }
  if (mongoose.connection.readyState === 1) {
    await Promise.all([
      User.deleteMany({}),
      Order.deleteMany({}),
      Delivery.deleteMany({}),
      Product.deleteMany({})
    ]);
  }
};

before(async function () {
  this.timeout(15000);
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.MONGODB_URI, {
        serverSelectionTimeoutMS: 3500,
        connectTimeoutMS: 3500
      });
      logger.info(`[TEST SETUP] Conectado a base de datos de testing: ${config.MONGODB_URI}`);
    }
    await clearTestDatabase();
  } catch (error) {
    // Se notifica explícitamente el motivo por el cual no se pudo conectar a MongoDB externo
    // antes de activar el motor de persistencia aislado en memoria para las pruebas.
    logger.warning(
      `[TEST SETUP] No se pudo conectar a MongoDB (${error.message}). Activando adaptador de persistencia en memoria para ejecutar la suite de tests.`
    );
    usingInMemoryFallback = true;
    enableInMemoryTestPersistence();
    clearMemoryStores();
  }
});

after(async function () {
  this.timeout(10000);
  await clearTestDatabase();
  if (!usingInMemoryFallback && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('[TEST SETUP] Conexión a base de datos de testing cerrada correctamente.');
  }
});
