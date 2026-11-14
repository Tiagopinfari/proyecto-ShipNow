import { Router } from 'express';
import userController from '../controllers/user.controller.js';
import { uploadUserDocumentMiddleware } from '../config/multer.config.js';

const router = Router();

router.get('/', (req, res, next) => userController.getAll(req, res, next));
router.get('/:id', (req, res, next) => userController.getById(req, res, next));
router.post('/', (req, res, next) => userController.create(req, res, next));
router.put('/:id', (req, res, next) => userController.update(req, res, next));
router.delete('/:id', (req, res, next) => userController.delete(req, res, next));

// Carga de documentos de usuario (DNI/identidad, licencia de conducir, etc.)
router.post('/:id/documents', uploadUserDocumentMiddleware, (req, res, next) =>
  userController.uploadDocument(req, res, next)
);

export default router;
