import logger from '../config/logger.js';

export const httpLogger = (req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    logger.http(`${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${durationMs}ms`);
  });

  next();
};

export default httpLogger;
