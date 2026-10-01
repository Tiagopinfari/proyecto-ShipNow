export const PRODUCT_STATUS = Object.freeze({
  AVAILABLE: 'available',
  OUT_OF_STOCK: 'out_of_stock'
});

export const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  USER: 'user'
});

export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
});

export default {
  PRODUCT_STATUS,
  USER_ROLES,
  HTTP_STATUS
};
