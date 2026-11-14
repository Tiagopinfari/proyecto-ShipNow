import multer from 'multer';
import path from 'path';
import fs from 'fs';
import logger from './logger.js';
import { DOCUMENT_TYPES } from '../constants/index.js';
import {
  FileRequiredError,
  InvalidFileTypeError,
  FileTooLargeError,
  ValidationError,
  FileStorageError
} from '../utils/errors.js';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_MIME_TYPES = Object.freeze([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
]);

export const ALLOWED_EXTENSIONS = Object.freeze([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp'
]);

export const UPLOAD_SUBFOLDERS = Object.freeze({
  [DOCUMENT_TYPES.USER_DOCUMENT]: 'uploads/users/documents',
  [DOCUMENT_TYPES.DRIVER_LICENSE]: 'uploads/users/licenses',
  [DOCUMENT_TYPES.DELIVERY_PROOF]: 'uploads/deliveries/proofs'
});

const ensureUploadDirectories = () => {
  Object.values(UPLOAD_SUBFOLDERS).forEach((relFolder) => {
    const absFolder = path.resolve(process.cwd(), relFolder);
    if (!fs.existsSync(absFolder)) {
      fs.mkdirSync(absFolder, { recursive: true });
    }
  });
};

ensureUploadDirectories();

const sanitizeBaseName = (originalName) => {
  const ext = path.extname(originalName).toLowerCase();
  const base = path.basename(originalName, path.extname(originalName))
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'archivo';
  return { base, ext };
};

export const buildGeneratedFilename = (prefix, originalName) => {
  const { base, ext } = sanitizeBaseName(originalName);
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  return `${prefix}-${uniqueSuffix}-${base}${ext}`;
};

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const isMimeValid = ALLOWED_MIME_TYPES.includes(file.mimetype);
  const isExtValid = ALLOWED_EXTENSIONS.includes(ext);

  if (!isMimeValid || !isExtValid) {
    logger.warning(
      `Intento de subida de archivo con tipo no permitido: "${file.originalname}" (mimetype: ${file.mimetype})`
    );
    return cb(
      new InvalidFileTypeError(
        `Tipo de archivo no permitido (${file.mimetype || ext}). Solo se aceptan PDF, JPG, JPEG, PNG y WEBP`
      ),
      false
    );
  }
  cb(null, true);
};

// Almacenamiento en memoria previo a la validación de negocio para no dejar archivos huérfanos en disco
const memoryUploader = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter
});

/**
 * Middleware centralizado para procesar un único archivo multipart/form-data
 * y transformar cualquier error de Multer en un error tipado del dominio.
 */
export const createSingleUploadMiddleware = (fieldName = 'file') => {
  const uploadSingle = memoryUploader.single(fieldName);

  return (req, res, next) => {
    uploadSingle(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            logger.warning(`Archivo rechazado por superar el límite de tamaño máximo (5 MB) en campo "${fieldName}"`);
            return next(new FileTooLargeError('El archivo supera el tamaño máximo permitido de 5 MB'));
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            logger.warning(`Campo de archivo inesperado recibido: "${err.field}". Se esperaba "${fieldName}"`);
            return next(
              new ValidationError(`Campo de archivo inválido ("${err.field}"). Debe enviarse en el campo "${fieldName}"`)
            );
          }
          logger.warning(`Error de Multer al procesar archivo: ${err.message}`);
          return next(new ValidationError(`Error en la carga del archivo: ${err.message}`));
        }
        return next(err);
      }

      if (!req.file) {
        logger.warning(`Intento de carga sin adjuntar archivo en el campo requerido "${fieldName}"`);
        return next(
          new FileRequiredError(`El archivo es obligatorio y debe enviarse en el campo "${fieldName}"`)
        );
      }

      next();
    });
  };
};

/**
 * Persiste el archivo ya validado en la subcarpeta correspondiente al tipo de documento
 * y devuelve el objeto de metadatos normalizado para almacenar en MongoDB.
 */
export const persistUploadedFile = ({ file, documentType, entityPrefix = 'doc' }) => {
  try {
    ensureUploadDirectories();
    const targetRelativeFolder = UPLOAD_SUBFOLDERS[documentType] || UPLOAD_SUBFOLDERS[DOCUMENT_TYPES.USER_DOCUMENT];
    const targetAbsFolder = path.resolve(process.cwd(), targetRelativeFolder);

    const filename = buildGeneratedFilename(entityPrefix, file.originalname);
    const absFilePath = path.join(targetAbsFolder, filename);
    const relativeFilePath = path.posix.join(targetRelativeFolder.replace(/\\/g, '/'), filename);

    fs.writeFileSync(absFilePath, file.buffer);

    return {
      name: file.originalname,
      originalName: file.originalname,
      filename,
      reference: relativeFilePath,
      path: relativeFilePath,
      mimetype: file.mimetype,
      size: file.size,
      documentType,
      uploadedAt: new Date()
    };
  } catch (error) {
    logger.error(`Error al guardar archivo en el servidor: ${error.message}`);
    throw new FileStorageError(`Error al almacenar el archivo en el servidor: ${error.message}`);
  }
};

export const uploadUserDocumentMiddleware = createSingleUploadMiddleware('file');
export const uploadProofMiddleware = createSingleUploadMiddleware('file');

export default {
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  UPLOAD_SUBFOLDERS,
  createSingleUploadMiddleware,
  uploadUserDocumentMiddleware,
  uploadProofMiddleware,
  persistUploadedFile
};
