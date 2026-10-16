import { errorResponse, createError } from '../utils/apiResponse.js';
import { ERROR_CODES } from '../utils/errorDictionary.js';

export const errorHandler = (err, req, res, next) => {
  let handledError = err;

  // Manejo de errores de Mongoose
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

  return errorResponse(res, handledError);
};

export default errorHandler;
