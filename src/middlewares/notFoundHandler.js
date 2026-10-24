import { createError } from '../utils/apiResponse.js';
import { ERROR_CODES } from '../utils/errorDictionary.js';
import logger from '../config/logger.js';

export const notFoundHandler = (req, res, next) => {
  const message = `Ruta inexistente solicitada: ${req.method} ${req.originalUrl || req.url}`;
  logger.warning(message);
  next(createError(ERROR_CODES.ROUTE_NOT_FOUND, message));
};

export default notFoundHandler;
