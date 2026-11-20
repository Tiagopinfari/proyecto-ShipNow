import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const isTestEnv = process.env.NODE_ENV === 'test';
const testEnvPath = path.resolve(process.cwd(), '.env.test');

if (isTestEnv && fs.existsSync(testEnvPath)) {
  dotenv.config({ path: testEnvPath });
}
dotenv.config();

const requiredEnvVars = ['PORT', 'MONGODB_URI', 'NODE_ENV', 'JWT_SECRET', 'SHIPPING_API_KEY'];

export const validateEnvVariables = (envSource = process.env) => {
  const missingEnvVars = requiredEnvVars.filter((key) => {
    const value = envSource[key];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missingEnvVars.length > 0) {
    const missingList = missingEnvVars.join(', ');
    throw new Error(
      `[ERROR DE CONFIGURACIÓN] Faltan variables de entorno críticas requeridas: ${missingList}. La aplicación no puede iniciar sin esta configuración.`
    );
  }
};

validateEnvVariables(process.env);

const resolveTestMongoUri = (baseUri, explicitTestUri) => {
  if (explicitTestUri && String(explicitTestUri).trim() !== '') {
    return explicitTestUri.trim();
  }
  if (!baseUri) return '';
  if (baseUri.includes('/shipnow?')) {
    return baseUri.replace('/shipnow?', '/shipnow_test?');
  }
  if (baseUri.endsWith('/shipnow')) {
    return `${baseUri}_test`;
  }
  return baseUri;
};

const isProd = process.env.NODE_ENV === 'production';
const isDev = process.env.NODE_ENV === 'development';

const activeMongoUri = isTestEnv
  ? resolveTestMongoUri(process.env.MONGODB_URI, process.env.MONGODB_TEST_URI)
  : process.env.MONGODB_URI;

const defaultLogLevel = isProd ? 'info' : 'debug';

const config = Object.freeze({
  PORT: parseInt(process.env.PORT, 10),
  MONGODB_URI: activeMongoUri,
  MONGODB_TEST_URI: resolveTestMongoUri(process.env.MONGODB_URI, process.env.MONGODB_TEST_URI),
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET,
  SHIPPING_API_KEY: process.env.SHIPPING_API_KEY,
  EXTERNAL_SHIPPING_API_URL:
    process.env.EXTERNAL_SHIPPING_API_URL || 'https://api.shipping.shipnow.internal/v1/rates',
  LOG_LEVEL: process.env.LOG_LEVEL || defaultLogLevel,
  ENABLE_SWAGGER_IN_PROD: process.env.ENABLE_SWAGGER_IN_PROD === 'true',
  ENABLE_INTERNAL_ENDPOINTS_IN_PROD: process.env.ENABLE_INTERNAL_ENDPOINTS_IN_PROD === 'true',
  isProduction: isProd,
  isDevelopment: isDev,
  isTest: isTestEnv
});

export default config;
