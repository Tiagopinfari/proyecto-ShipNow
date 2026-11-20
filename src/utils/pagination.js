import { ValidationError } from './errors.js';

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
export const DEFAULT_PAGE = 1;

/**
 * Normaliza y valida los parámetros de paginación (page, limit) de la consulta
 * garantizando que nunca se devuelva una colección completa sin control.
 */
export const parsePaginationParams = (query = {}) => {
  const rawPage = query.page !== undefined ? query.page : DEFAULT_PAGE;
  const rawLimit = query.limit !== undefined ? query.limit : DEFAULT_LIMIT;

  const page = Number(rawPage);
  const limit = Number(rawLimit);

  if (!Number.isInteger(page) || page < 1) {
    throw new ValidationError('El parámetro de paginación "page" debe ser un número entero mayor o igual a 1');
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new ValidationError('El parámetro de paginación "limit" debe ser un número entero mayor o igual a 1');
  }

  const effectiveLimit = Math.min(limit, MAX_LIMIT);
  const skip = (page - 1) * effectiveLimit;

  return {
    page,
    limit: effectiveLimit,
    skip
  };
};

export default {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  DEFAULT_PAGE,
  parsePaginationParams
};
