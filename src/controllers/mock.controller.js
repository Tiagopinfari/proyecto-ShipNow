import { mockService } from '../services/mocks.service.js';
import { HTTP_STATUS } from '../constants/index.js';

class MockController {
  getUsers(req, res, next) {
    try {
      const users = mockService.getMockUsers(req.query.qty);
      return res.status(HTTP_STATUS.OK).json(users);
    } catch (error) {
      next(error);
    }
  }

  getOrders(req, res, next) {
    try {
      const orders = mockService.getMockOrders(req.query.qty);
      return res.status(HTTP_STATUS.OK).json(orders);
    } catch (error) {
      next(error);
    }
  }

  getDeliveries(req, res, next) {
    try {
      const deliveries = mockService.getMockDeliveries(req.query.qty);
      return res.status(HTTP_STATUS.OK).json(deliveries);
    } catch (error) {
      next(error);
    }
  }

  getAll(req, res, next) {
    try {
      const allMocks = mockService.getMockAll(req.query.qty);
      return res.status(HTTP_STATUS.OK).json(allMocks);
    } catch (error) {
      next(error);
    }
  }

  async seed(req, res, next) {
    try {
      const qty = req.query.qty ?? req.body?.qty;
      const collection = req.query.collection ?? req.query.coleccion ?? req.body?.collection ?? req.body?.coleccion;
      const result = await mockService.seed({ qty, collection });
      return res.status(HTTP_STATUS.CREATED).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const mockController = new MockController();
export default mockController;
