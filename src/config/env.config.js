import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const isTestEnv = process.env.NODE_ENV === 'test';
const testEnvPath = path.resolve(process.cwd(), '.env.test');

if (isTestEnv && fs.existsSync(testEnvPath)) {
  dotenv.config({ path: testEnvPath });
}
dotenv.config();

const requiredEnvVars = ['PORT', 'MONGODB_URI', 'NODE_ENV'];

const missingEnvVars = requiredEnvVars.filter((key) => {
  const value = process.env[key];
  return value === undefined || value === null || String(value).trim() === '';
});

if (missingEnvVars.length > 0) {
  const missingList = missingEnvVars.join(', ');
  throw new Error(
    `[ERROR DE CONFIGURACIÓN] Faltan variables de entorno críticas requeridas: ${missingList}. La aplicación no puede iniciar sin esta configuración.`
  );
}

const resolveTestMongoUri = (baseUri, explicitTestUri) => {
  if (explicitTestUri && String(explicitTestUri).trim() !== '') {
    return explicitTestUri.trim();
  }
  if (!baseUri) return 'mongodb://127.0.0.1:27017/shipnow_test';
  // Si la URI apunta a /shipnow, la separa automáticamente en /shipnow_test
  if (baseUri.includes('/shipnow?')) {
    return baseUri.replace('/shipnow?', '/shipnow_test?');
  }
  if (baseUri.endsWith('/shipnow')) {
    return `${baseUri}_test`;
  }
  return baseUri;
};

const activeMongoUri = isTestEnv
  ? resolveTestMongoUri(process.env.MONGODB_URI, process.env.MONGODB_TEST_URI)
  : process.env.MONGODB_URI;

const config = Object.freeze({
  PORT: parseInt(process.env.PORT, 10),
  MONGODB_URI: activeMongoUri,
  MONGODB_TEST_URI: resolveTestMongoUri(process.env.MONGODB_URI, process.env.MONGODB_TEST_URI),
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET || 'mi_clave_secreta',
  SHIPPING_API_KEY: process.env.SHIPPING_API_KEY || 'shipnow_shipping_key_123',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: isTestEnv
});

export default config;
