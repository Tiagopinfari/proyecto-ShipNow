import { Router } from 'express';
import orderController from '../controllers/order.controller.js';

const router = Router();

router.get('/', (req, res, next) => orderController.getAll(req, res, next));
router.get('/:id', (req, res, next) => orderController.getById(req, res, next));
router.post('/', (req, res, next) => orderController.create(req, res, next));
router.put('/:id', (req, res, next) => orderController.update(req, res, next));
router.delete('/:id', (req, res, next) => orderController.delete(req, res, next));

export default router;
