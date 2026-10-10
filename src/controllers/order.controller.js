import orderService from '../services/order.service.js';
import { HTTP_STATUS } from '../constants/index.js';

class OrderController {
  async getAll(req, res, next) {
    try {
      const orders = await orderService.getOrders();
      return res.status(HTTP_STATUS.OK).json(orders);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const order = await orderService.getOrderById(req.params.id);
      return res.status(HTTP_STATUS.OK).json(order);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const newOrder = await orderService.createOrder(req.body);
      return res.status(HTTP_STATUS.CREATED).json(newOrder);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const updatedOrder = await orderService.updateOrder(req.params.id, req.body);
      return res.status(HTTP_STATUS.OK).json(updatedOrder);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await orderService.deleteOrder(req.params.id);
      return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const orderController = new OrderController();
export default orderController;
