export const ERROR_CODES = Object.freeze({
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  DELIVERY_NOT_FOUND: 'DELIVERY_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_QUANTITY: 'INVALID_QUANTITY',
  INVALID_USER_ROLE: 'INVALID_USER_ROLE',
  INVALID_STATUS: 'INVALID_STATUS',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  FORBIDDEN_OPERATION: 'FORBIDDEN_OPERATION',
  DATABASE_ERROR: 'DATABASE_ERROR'
});

export const ERROR_DICTIONARY = Object.freeze({
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: {
    statusCode: 500,
    message: 'Error interno en el servidor'
  },
  [ERROR_CODES.ROUTE_NOT_FOUND]: {
    statusCode: 404,
    message: 'Ruta no encontrada'
  },
  [ERROR_CODES.USER_NOT_FOUND]: {
    statusCode: 404,
    message: 'Usuario no encontrado'
  },
  [ERROR_CODES.PRODUCT_NOT_FOUND]: {
    statusCode: 404,
    message: 'Producto no encontrado'
  },
  [ERROR_CODES.ORDER_NOT_FOUND]: {
    statusCode: 404,
    message: 'Pedido no encontrado'
  },
  [ERROR_CODES.DELIVERY_NOT_FOUND]: {
    statusCode: 404,
    message: 'Entrega no encontrada'
  },
  [ERROR_CODES.VALIDATION_ERROR]: {
    statusCode: 400,
    message: 'Faltan datos obligatorios o formato inválido'
  },
  [ERROR_CODES.INVALID_QUANTITY]: {
    statusCode: 400,
    message: 'Cantidad de datos inválida'
  },
  [ERROR_CODES.INVALID_USER_ROLE]: {
    statusCode: 400,
    message: 'Rol de usuario inválido'
  },
  [ERROR_CODES.INVALID_STATUS]: {
    statusCode: 400,
    message: 'Estado o prioridad inválidos'
  },
  [ERROR_CODES.CONFLICT_ERROR]: {
    statusCode: 409,
    message: 'El recurso ya existe o genera conflicto de datos'
  },
  [ERROR_CODES.FORBIDDEN_OPERATION]: {
    statusCode: 403,
    message: 'Operación no permitida'
  },
  [ERROR_CODES.DATABASE_ERROR]: {
    statusCode: 500,
    message: 'Error al operar con la base de datos'
  }
});

export default {
  ERROR_CODES,
  ERROR_DICTIONARY
};
