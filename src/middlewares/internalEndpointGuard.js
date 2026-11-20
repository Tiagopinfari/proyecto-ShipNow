import config from '../config/env.config.js';
import logger from '../config/logger.js';
import { ForbiddenError } from '../utils/errors.js';

/**
 * Middleware que aplica el criterio de seguridad sobre endpoints internos
 * (/api/mocks, /api/loggerTest) en entorno de producción:
 * - En development y test están habilitados libremente.
 * - En production se restringen con 403 FORBIDDEN_OPERATION salvo que
 *   ENABLE_INTERNAL_ENDPOINTS_IN_PROD=true esté explícitamente configurado.
 */
export const internalEndpointGuard = (req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production' || config.isProduction;
  const allowInternal =
    process.env.ENABLE_INTERNAL_ENDPOINTS_IN_PROD === 'true' ||
    config.ENABLE_INTERNAL_ENDPOINTS_IN_PROD;

  if (isProd && !allowInternal) {
    logger.warning(
      `Acceso bloqueado a herramienta interna en entorno de producción: ${req.method} ${req.originalUrl || req.url}`
    );
    return next(
      new ForbiddenError(
        'Este endpoint de herramienta interna está deshabilitado en el entorno de producción por seguridad'
      )
    );
  }

  return next();
};

/**
 * Middleware para controlar el acceso a Swagger UI (/api/docs) en producción:
 * - En development y test está siempre activo.
 * - En production se restringe salvo que ENABLE_SWAGGER_IN_PROD=true.
 */
export const swaggerProdGuard = (req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production' || config.isProduction;
  const allowSwagger =
    process.env.ENABLE_SWAGGER_IN_PROD === 'true' ||
    config.ENABLE_SWAGGER_IN_PROD;

  if (isProd && !allowSwagger) {
    logger.warning(
      `Acceso bloqueado a documentación Swagger en entorno de producción: ${req.method} ${req.originalUrl || req.url}`
    );
    return next(
      new ForbiddenError(
        'La documentación interactiva Swagger está deshabilitada en producción (configure ENABLE_SWAGGER_IN_PROD=true para habilitarla)'
      )
    );
  }

  return next();
};

export default {
  internalEndpointGuard,
  swaggerProdGuard
};
