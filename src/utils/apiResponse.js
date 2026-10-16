import { ERROR_CODES, ERROR_DICTIONARY } from './errorDictionary.js';

export const successResponse = (res, { statusCode = 200, message = '', payload = null }) => {
  return res.status(statusCode).json({
    status: 'success',
    ...(message && { message }),
    payload
  });
};

export const createError = (code, customMessage = null, details = null) => {
  const isInDictionary = code in ERROR_DICTIONARY;
  const activeCode = isInDictionary ? code : ERROR_CODES.INTERNAL_SERVER_ERROR;
  const configError = ERROR_DICTIONARY[activeCode];

  const error = new Error(customMessage || configError.message);
  error.statusCode = configError.statusCode;
  error.code = activeCode;
  if (details) {
    error.details = details;
  }

  return error;
};

export const errorResponse = (res, error) => {
  const fallback = ERROR_DICTIONARY[ERROR_CODES.INTERNAL_SERVER_ERROR];
  const statusCode = error.statusCode || fallback.statusCode;
  const message = error.message || fallback.message;
  const code = error.code || ERROR_CODES.INTERNAL_SERVER_ERROR;

  const responseBody = {
    status: 'error',
    message,
    code
  };

  if (error.details) {
    responseBody.details = error.details;
  }

  return res.status(statusCode).json(responseBody);
};

export default {
  successResponse,
  createError,
  errorResponse
};
