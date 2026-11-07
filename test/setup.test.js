import mongoose from 'mongoose';
import config from '../src/config/env.config.js';
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
    }
    await clearTestDatabase();
  } catch {
    // Si el entorno de testing no tiene una instancia activa de MongoDB local/Atlas accesible,
    // activa automáticamente el motor de persistencia de testing aislado en memoria.
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
  }
});
