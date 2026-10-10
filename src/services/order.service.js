import orderRepository from '../repositories/order.repository.js';
import userRepository from '../repositories/user.repository.js';
import { AppError } from '../utils/errors.js';
import config from '../config/env.config.js';
import { ORDER_STATUS, DELIVERY_PRIORITY } from '../constants/index.js';

export const calculateShippingCost = ({ isProduction, shipmentValue, apiKey }) => {
  if (!apiKey) {
    throw new AppError('Configuración inválida: falta API Key', 500);
  }
  if (isProduction) {
    return 50 + shipmentValue * 0.01;
  }
  return 10;
};

class OrderService {
  async getOrders() {
    return await orderRepository.getAll();
  }

  async getOrderById(id) {
    const order = await orderRepository.getById(id);
    if (!order) {
      throw new AppError('Pedido no encontrado', 404);
    }
    return order;
  }

  async createOrder(newOrder) {
    const customer = await userRepository.getById(newOrder.customer);
    if (!customer) {
      throw new AppError('El cliente especificado no existe', 400);
    }

    if (!newOrder.items || !Array.isArray(newOrder.items) || newOrder.items.length === 0) {
      throw new AppError('El pedido debe tener al menos un item', 400);
    }

    const itemsTotal = newOrder.items.reduce(
      (sum, item) => sum + item.price * item.quantity, 0
    );

    const declaredValue = newOrder.declaredValue || itemsTotal;
    const shippingCost = calculateShippingCost({
      isProduction: config.isProduction,
      shipmentValue: declaredValue,
      apiKey: config.SHIPPING_API_KEY || config.JWT_SECRET
    });

    return await orderRepository.create({
      ...newOrder,
      declaredValue,
      shippingCost,
      total: itemsTotal + shippingCost,
      status: ORDER_STATUS.CREATED,
      priority: newOrder.priority || DELIVERY_PRIORITY.NORMAL
    });
  }

  async updateOrder(id, updates) {
    const order = await orderRepository.update(id, updates);
    if (!order) {
      throw new AppError('Pedido no encontrado', 404);
    }
    return order;
  }

  async deleteOrder(id) {
    const order = await orderRepository.delete(id);
    if (!order) {
      throw new AppError('Pedido no encontrado', 404);
    }
    return { message: 'Pedido eliminado' };
  }
}

export const orderService = new OrderService();
export default orderService;
