import { Router } from 'express';
import productController from '../controllers/product.controller.js';

const router = Router();

router.get('/', (req, res, next) => productController.getAll(req, res, next));
router.get('/:id', (req, res, next) => productController.getById(req, res, next));
router.get('/:id/shipping-cost', (req, res, next) => productController.getShippingCost(req, res, next));
router.post('/', (req, res, next) => productController.create(req, res, next));
router.put('/:id', (req, res, next) => productController.update(req, res, next));
router.delete('/:id', (req, res, next) => productController.delete(req, res, next));

export default router;
