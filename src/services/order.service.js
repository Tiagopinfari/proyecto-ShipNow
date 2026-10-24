import orderRepository from '../repositories/order.repository.js';
import userRepository from '../repositories/user.repository.js';
import {
  OrderNotFoundError,
  UserNotFoundError,
  ValidationError,
  InvalidStatusError
} from '../utils/errors.js';
import config from '../config/env.config.js';
import logger from '../config/logger.js';
import { ORDER_STATUS, DELIVERY_PRIORITY } from '../constants/index.js';
import { createError } from '../utils/apiResponse.js';
import { ERROR_CODES } from '../utils/errorDictionary.js';

export const calculateShippingCost = ({ isProduction, shipmentValue, apiKey }) => {
  if (!apiKey) {
    throw createError(ERROR_CODES.INTERNAL_SERVER_ERROR, 'Configuración inválida: falta API Key');
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
      logger.warning(`Consulta de pedido inexistente: ID ${id}`);
      throw new OrderNotFoundError('Pedido no encontrado');
    }
    return order;
  }

  async createOrder(newOrder) {
    const customer = await userRepository.getById(newOrder.customer);
    if (!customer) {
      logger.warning(`Fallo al crear pedido: cliente inexistente ID ${newOrder.customer}`);
      throw new UserNotFoundError('El cliente especificado no existe');
    }

    if (!newOrder.items || !Array.isArray(newOrder.items) || newOrder.items.length === 0) {
      logger.warning('Fallo al crear pedido: no contiene items');
      throw new ValidationError('El pedido debe tener al menos un item');
    }

    if (newOrder.status && !Object.values(ORDER_STATUS).includes(newOrder.status)) {
      throw new InvalidStatusError('Estado de pedido inválido');
    }

    if (newOrder.priority && !Object.values(DELIVERY_PRIORITY).includes(newOrder.priority)) {
      throw new InvalidStatusError('Prioridad de pedido inválida');
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

    const createdOrder = await orderRepository.create({
      ...newOrder,
      declaredValue,
      shippingCost,
      total: itemsTotal + shippingCost,
      status: ORDER_STATUS.CREATED,
      priority: newOrder.priority || DELIVERY_PRIORITY.NORMAL
    });

    logger.info(`Pedido creado exitosamente con ID: ${createdOrder._id} (total: $${createdOrder.total})`);
    return createdOrder;
  }

  async updateOrder(id, updates) {
    const order = await orderRepository.update(id, updates);
    if (!order) {
      logger.warning(`Intento de actualización en pedido inexistente: ID ${id}`);
      throw new OrderNotFoundError('Pedido no encontrado');
    }
    logger.info(`Pedido actualizado exitosamente: ID ${id}`);
    return order;
  }

  async deleteOrder(id) {
    const order = await orderRepository.delete(id);
    if (!order) {
      logger.warning(`Intento de eliminación en pedido inexistente: ID ${id}`);
      throw new OrderNotFoundError('Pedido no encontrado');
    }
    logger.info(`Pedido eliminado exitosamente: ID ${id}`);
    return { message: 'Pedido eliminado' };
  }
}

export const orderService = new OrderService();
export default orderService;
