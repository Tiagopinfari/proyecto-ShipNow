import { ERROR_CODES, ERROR_DICTIONARY } from './errorDictionary.js';

export class CustomError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    if (details) {
      this.details = details;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AppError extends CustomError {
  constructor(message, statusCode = 500, code = ERROR_CODES.INTERNAL_SERVER_ERROR, details = null) {
    super(message, statusCode, code, details);
  }
}

export class NotFoundError extends CustomError {
  constructor(message = ERROR_DICTIONARY[ERROR_CODES.ROUTE_NOT_FOUND].message, code = ERROR_CODES.ROUTE_NOT_FOUND) {
    super(message, 404, code);
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(message = ERROR_DICTIONARY[ERROR_CODES.USER_NOT_FOUND].message) {
    super(message, ERROR_CODES.USER_NOT_FOUND);
  }
}

export class ProductNotFoundError extends NotFoundError {
  constructor(message = ERROR_DICTIONARY[ERROR_CODES.PRODUCT_NOT_FOUND].message) {
    super(message, ERROR_CODES.PRODUCT_NOT_FOUND);
  }
}

export class OrderNotFoundError extends NotFoundError {
  constructor(message = ERROR_DICTIONARY[ERROR_CODES.ORDER_NOT_FOUND].message) {
    super(message, ERROR_CODES.ORDER_NOT_FOUND);
  }
}

export class DeliveryNotFoundError extends NotFoundError {
  constructor(message = ERROR_DICTIONARY[ERROR_CODES.DELIVERY_NOT_FOUND].message) {
    super(message, ERROR_CODES.DELIVERY_NOT_FOUND);
  }
}

export class RouteNotFoundError extends NotFoundError {
  constructor(message = ERROR_DICTIONARY[ERROR_CODES.ROUTE_NOT_FOUND].message) {
    super(message, ERROR_CODES.ROUTE_NOT_FOUND);
  }
}

export class ValidationError extends CustomError {
  constructor(message = ERROR_DICTIONARY[ERROR_CODES.VALIDATION_ERROR].message, details = null) {
    super(message, 400, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

export class InvalidQuantityError extends CustomError {
  constructor(message = ERROR_DICTIONARY[ERROR_CODES.INVALID_QUANTITY].message) {
    super(message, 400, ERROR_CODES.INVALID_QUANTITY);
  }
}

export class InvalidRoleError extends CustomError {
  constructor(message = ERROR_DICTIONARY[ERROR_CODES.INVALID_USER_ROLE].message) {
    super(message, 400, ERROR_CODES.INVALID_USER_ROLE);
  }
}

export class InvalidStatusError extends CustomError {
  constructor(message = ERROR_DICTIONARY[ERROR_CODES.INVALID_STATUS].message) {
    super(message, 400, ERROR_CODES.INVALID_STATUS);
  }
}

export class ConflictError extends CustomError {
  constructor(message = ERROR_DICTIONARY[ERROR_CODES.CONFLICT_ERROR].message) {
    super(message, 409, ERROR_CODES.CONFLICT_ERROR);
  }
}

export class ForbiddenError extends CustomError {
  constructor(message = ERROR_DICTIONARY[ERROR_CODES.FORBIDDEN_OPERATION].message) {
    super(message, 403, ERROR_CODES.FORBIDDEN_OPERATION);
  }
}

export class DatabaseOperationError extends CustomError {
  constructor(message = ERROR_DICTIONARY[ERROR_CODES.DATABASE_ERROR].message) {
    super(message, 500, ERROR_CODES.DATABASE_ERROR);
  }
}
