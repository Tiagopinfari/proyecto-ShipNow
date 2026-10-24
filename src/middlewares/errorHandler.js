import { errorResponse, createError } from '../utils/apiResponse.js';
import { ERROR_CODES } from '../utils/errorDictionary.js';
import logger from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  let handledError = err;

  // Manejo de errores nativos de Mongoose
  if (err.name === 'CastError') {
    handledError = createError(ERROR_CODES.VALIDATION_ERROR, 'ID inválido o con formato incorrecto');
  } else if (err.name === 'ValidationError') {
    const errorMessages = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(', ');
    handledError = createError(ERROR_CODES.VALIDATION_ERROR, errorMessages || 'Error de validación de esquema');
  } else if (err.code === 11000) {
    handledError = createError(ERROR_CODES.CONFLICT_ERROR, 'Clave duplicada: el registro ya existe en la base de datos');
  }

  const statusCode = handledError.statusCode || 500;
  const code = handledError.code || ERROR_CODES.INTERNAL_SERVER_ERROR;
  const logMessage = `${code} [${statusCode}] - ${handledError.message} - ${req.method} ${req.originalUrl || req.url}`;

  // Diferenciación de niveles de severidad:
  // Errores de negocio (4xx) -> warning
  // Errores inesperados de servidor (5xx) -> error
  if (statusCode >= 500) {
    logger.error(logMessage);
  } else {
    logger.warning(logMessage);
  }

  return errorResponse(res, handledError);
};

export default errorHandler;
