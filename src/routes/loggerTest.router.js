import { Router } from 'express';
import logger from '../config/logger.js';

const router = Router();

router.get('/', (req, res) => {
  // Disparo de logs en todos los niveles requeridos
  logger.debug('Mensaje de prueba - nivel DEBUG');
  logger.http('Mensaje de prueba - nivel HTTP');
  logger.info('Mensaje de prueba - nivel INFO');
  logger.warning('Mensaje de prueba - nivel WARNING');
  logger.error('Mensaje de prueba - nivel ERROR');
  logger.fatal('Mensaje de prueba - nivel FATAL');

  return res.status(200).json({
    status: 'success',
    message: 'Logs de prueba ejecutados correctamente en todos los niveles (debug, http, info, warning, error, fatal)',
    levelsTested: ['debug', 'http', 'info', 'warning', 'error', 'fatal']
  });
});

export default router;
