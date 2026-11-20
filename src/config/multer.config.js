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

const ensureUploadDirectoriesSync = () => {
  Object.values(UPLOAD_SUBFOLDERS).forEach((relFolder) => {
    const absFolder = path.resolve(process.cwd(), relFolder);
    if (!fs.existsSync(absFolder)) {
      fs.mkdirSync(absFolder, { recursive: true });
    }
  });
};

ensureUploadDirectoriesSync();

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

const resolveTargetRelativeFolder = (req, defaultDocType) => {
  const rawType = req.body?.documentType ?? req.query?.documentType ?? defaultDocType;
  const normalizedType = String(rawType || defaultDocType).trim();
  return UPLOAD_SUBFOLDERS[normalizedType] || UPLOAD_SUBFOLDERS[defaultDocType] || UPLOAD_SUBFOLDERS[DOCUMENT_TYPES.USER_DOCUMENT];
};

/**
 * Configuración nativa de multer.diskStorage que define dinámicamente
 * la subcarpeta de destino y el nombre único generado para cada archivo.
 */
export const createDiskStorage = (defaultDocType = DOCUMENT_TYPES.USER_DOCUMENT, entityPrefixName = 'doc') => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        const relFolder = resolveTargetRelativeFolder(req, defaultDocType);
        const absFolder = path.resolve(process.cwd(), relFolder);
        fs.promises.mkdir(absFolder, { recursive: true })
          .then(() => {
            req._uploadRelativeFolder = relFolder;
            cb(null, absFolder);
          })
          .catch((err) => cb(new FileStorageError(`No se pudo preparar el directorio de destino: ${err.message}`)));
      } catch (err) {
        cb(new FileStorageError(`Error al determinar carpeta de destino: ${err.message}`));
      }
    },
    filename: (req, file, cb) => {
      const entityId = req.params?.id || 'general';
      const generatedName = buildGeneratedFilename(`${entityPrefixName}-${entityId}`, file.originalname);
      cb(null, generatedName);
    }
  });
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

/**
 * Elimina de forma asíncrona (sin bloquear el Event Loop) un archivo temporal en disco
 * cuando una validación posterior de negocio falla (ej. usuario o entrega inexistente).
 */
export const removeUploadedFileAsync = async (file) => {
  if (file && file.path) {
    try {
      await fs.promises.unlink(file.path);
    } catch {
      // Si el archivo ya no existe no requiere acción adicional
    }
  }
};

/**
 * Middleware centralizado con multer.diskStorage para procesar un único archivo
 * multipart/form-data y transformar errores de Multer en errores tipados del dominio.
 */
export const createSingleUploadMiddleware = (
  fieldName = 'file',
  { defaultDocType = DOCUMENT_TYPES.USER_DOCUMENT, entityPrefix = 'doc' } = {}
) => {
  const uploader = multer({
    storage: createDiskStorage(defaultDocType, entityPrefix),
    limits: {
      fileSize: MAX_FILE_SIZE
    },
    fileFilter
  });

  const uploadSingle = uploader.single(fieldName);

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
 * Normaliza y reubica (si el documentType del body difiere del default) el archivo
 * almacenado por diskStorage de forma asíncrona (no bloqueante) y devuelve sus metadatos.
 */
export const finalizeUploadedFileAsync = async ({ file, documentType, entityPrefix = 'doc' }) => {
  try {
    const targetRelativeFolder = UPLOAD_SUBFOLDERS[documentType] || UPLOAD_SUBFOLDERS[DOCUMENT_TYPES.USER_DOCUMENT];
    const targetAbsFolder = path.resolve(process.cwd(), targetRelativeFolder);
    await fs.promises.mkdir(targetAbsFolder, { recursive: true });

    const filename = file.filename || buildGeneratedFilename(entityPrefix, file.originalname);
    const desiredAbsPath = path.join(targetAbsFolder, filename);
    const relativeFilePath = path.posix.join(targetRelativeFolder.replace(/\\/g, '/'), filename);

    if (file.path && path.resolve(file.path) !== path.resolve(desiredAbsPath)) {
      await fs.promises.rename(file.path, desiredAbsPath);
    } else if (!file.path && file.buffer) {
      await fs.promises.writeFile(desiredAbsPath, file.buffer);
    }

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
    await removeUploadedFileAsync(file);
    logger.error(`Error al procesar el archivo en el servidor: ${error.message}`);
    throw new FileStorageError(`Error al almacenar el archivo en el servidor: ${error.message}`);
  }
};

export const uploadUserDocumentMiddleware = createSingleUploadMiddleware('file', {
  defaultDocType: DOCUMENT_TYPES.USER_DOCUMENT,
  entityPrefix: 'user'
});

export const uploadProofMiddleware = createSingleUploadMiddleware('file', {
  defaultDocType: DOCUMENT_TYPES.DELIVERY_PROOF,
  entityPrefix: 'proof'
});

export default {
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  UPLOAD_SUBFOLDERS,
  createDiskStorage,
  createSingleUploadMiddleware,
  uploadUserDocumentMiddleware,
  uploadProofMiddleware,
  finalizeUploadedFileAsync,
  removeUploadedFileAsync
};
