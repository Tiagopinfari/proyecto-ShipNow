import deliveryRepository from '../repositories/delivery.repository.js';
import orderRepository from '../repositories/order.repository.js';
import userRepository from '../repositories/user.repository.js';
import {
  DeliveryNotFoundError,
  OrderNotFoundError,
  UserNotFoundError,
  InvalidRoleError,
  InvalidStatusError
} from '../utils/errors.js';
import logger from '../config/logger.js';
import { USER_ROLES, DELIVERY_STATUS, DELIVERY_PRIORITY } from '../constants/index.js';

class DeliveryService {
  async getDeliveries() {
    return await deliveryRepository.getAll();
  }

  async getDeliveryById(id) {
    const delivery = await deliveryRepository.getById(id);
    if (!delivery) {
      logger.warning(`Consulta de entrega inexistente: ID ${id}`);
      throw new DeliveryNotFoundError('Entrega no encontrada');
    }
    return delivery;
  }

  async createDelivery(newDelivery) {
    const order = await orderRepository.getById(newDelivery.order);
    if (!order) {
      logger.warning(`Fallo al crear entrega: pedido inexistente ID ${newDelivery.order}`);
      throw new OrderNotFoundError('El pedido especificado no existe');
    }

    if (newDelivery.driver) {
      const driver = await userRepository.getById(newDelivery.driver);
      if (!driver) {
        logger.warning(`Fallo al crear entrega: repartidor inexistente ID ${newDelivery.driver}`);
        throw new UserNotFoundError('El repartidor especificado no existe');
      }
      if (driver.role !== USER_ROLES.DRIVER && driver.role !== USER_ROLES.REPARTIDOR) {
        logger.warning(`Usuario ID ${newDelivery.driver} no posee rol de repartidor`);
        throw new InvalidRoleError('El usuario especificado no posee rol de repartidor/driver');
      }
    } else {
      logger.warning(`Entrega para pedido #${newDelivery.order} registrada sin repartidor asignado`);
    }

    if (newDelivery.status && !Object.values(DELIVERY_STATUS).includes(newDelivery.status)) {
      throw new InvalidStatusError('Estado de entrega inválido');
    }

    if (newDelivery.priority && !Object.values(DELIVERY_PRIORITY).includes(newDelivery.priority)) {
      throw new InvalidStatusError('Prioridad de entrega inválida');
    }

    const createdDelivery = await deliveryRepository.create(newDelivery);
    logger.info(`Entrega creada exitosamente con ID: ${createdDelivery._id} (Pedido: ${createdDelivery.order})`);
    return createdDelivery;
  }

  async updateDelivery(id, updates) {
    const delivery = await deliveryRepository.update(id, updates);
    if (!delivery) {
      logger.warning(`Intento de actualización en entrega inexistente: ID ${id}`);
      throw new DeliveryNotFoundError('Entrega no encontrada');
    }
    logger.info(`Entrega actualizada exitosamente: ID ${id}`);
    return delivery;
  }

  async deleteDelivery(id) {
    const delivery = await deliveryRepository.delete(id);
    if (!delivery) {
      logger.warning(`Intento de eliminación en entrega inexistente: ID ${id}`);
      throw new DeliveryNotFoundError('Entrega no encontrada');
    }
    logger.info(`Entrega eliminada exitosamente: ID ${id}`);
    return { message: 'Entrega eliminada' };
  }
}

export const deliveryService = new DeliveryService();
export default deliveryService;
