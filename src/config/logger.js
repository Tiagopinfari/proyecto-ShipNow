import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import config from './env.config.js';
import path from 'path';
import fs from 'fs';

// Asegurar existencia de la carpeta logs
const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Niveles personalizados según la jerarquía solicitada (menor número = mayor criticidad)
const customLevels = {
  levels: {
    fatal: 0,
    error: 1,
    warning: 2,
    info: 3,
    http: 4,
    debug: 5
  },
  colors: {
    fatal: 'magenta',
    error: 'red',
    warning: 'yellow',
    info: 'blue',
    http: 'green',
    debug: 'cyan'
  }
};

winston.addColors(customLevels.colors);

// Formato de salida: timestamp + [nivel] + mensaje
const logFormat = winston.format.printf(({ timestamp, level, message }) => {
  return `${timestamp} [${level}] ${message}`;
});

const isProd = config.isProduction;

const logger = winston.createLogger({
  levels: customLevels.levels,
  level: isProd ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // 1. Salida por consola: en dev muestra desde debug; en prod desde info
    new winston.transports.Console({
      level: isProd ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    }),

    // 2. Archivo específico logs/error.log (solo error y fatal) con rotación por tamaño
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    }),

    // 3. Archivo rotativo diario logs/errors-%DATE%.log (solo error y fatal)
    new DailyRotateFile({
      filename: 'logs/errors-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    })
  ]
});

export default logger;
