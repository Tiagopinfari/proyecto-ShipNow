import deliveryService from '../services/delivery.service.js';
import { HTTP_STATUS } from '../constants/index.js';

class DeliveryController {
  async getAll(req, res, next) {
    try {
      const deliveries = await deliveryService.getDeliveries();
      return res.status(HTTP_STATUS.OK).json(deliveries);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const delivery = await deliveryService.getDeliveryById(req.params.id);
      return res.status(HTTP_STATUS.OK).json(delivery);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const newDelivery = await deliveryService.createDelivery(req.body);
      return res.status(HTTP_STATUS.CREATED).json(newDelivery);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const updatedDelivery = await deliveryService.updateDelivery(req.params.id, req.body);
      return res.status(HTTP_STATUS.OK).json(updatedDelivery);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await deliveryService.deleteDelivery(req.params.id);
      return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const deliveryController = new DeliveryController();
export default deliveryController;
