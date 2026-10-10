import { Router } from 'express';
import mockController from '../controllers/mock.controller.js';

const router = Router();

// Endpoints de generación en memoria (sin persistir en base de datos)
router.get('/users', (req, res, next) => mockController.getUsers(req, res, next));
router.get('/mockingUsers', (req, res, next) => mockController.getUsers(req, res, next)); // alias compatible
router.get('/orders', (req, res, next) => mockController.getOrders(req, res, next));
router.get('/deliveries', (req, res, next) => mockController.getDeliveries(req, res, next));
router.get('/all', (req, res, next) => mockController.getAll(req, res, next));

// Endpoint de inserción controlada en MongoDB
router.post('/seed', (req, res, next) => mockController.seed(req, res, next));

export default router;
