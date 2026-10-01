import dotenv from 'dotenv';

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

const config = Object.freeze({
  PORT: parseInt(process.env.PORT, 10),
  MONGODB_URI: process.env.MONGODB_URI,
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET || 'mi_clave_secreta',
  SHIPPING_API_KEY: process.env.SHIPPING_API_KEY || 'shipnow_shipping_key_123',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development'
});

export default config;
