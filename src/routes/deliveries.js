import { Router } from 'express';
import deliveryController from '../controllers/delivery.controller.js';

const router = Router();

router.get('/', (req, res, next) => deliveryController.getAll(req, res, next));
router.get('/:id', (req, res, next) => deliveryController.getById(req, res, next));
router.post('/', (req, res, next) => deliveryController.create(req, res, next));
router.put('/:id', (req, res, next) => deliveryController.update(req, res, next));
router.delete('/:id', (req, res, next) => deliveryController.delete(req, res, next));

export default router;
