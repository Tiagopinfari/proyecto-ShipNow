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
import { USER_ROLES, DELIVERY_STATUS, DELIVERY_PRIORITY } from '../constants/index.js';

class DeliveryService {
  async getDeliveries() {
    return await deliveryRepository.getAll();
  }

  async getDeliveryById(id) {
    const delivery = await deliveryRepository.getById(id);
    if (!delivery) {
      throw new DeliveryNotFoundError('Entrega no encontrada');
    }
    return delivery;
  }

  async createDelivery(newDelivery) {
    const order = await orderRepository.getById(newDelivery.order);
    if (!order) {
      throw new OrderNotFoundError('El pedido especificado no existe');
    }

    if (newDelivery.driver) {
      const driver = await userRepository.getById(newDelivery.driver);
      if (!driver) {
        throw new UserNotFoundError('El repartidor especificado no existe');
      }
      if (driver.role !== USER_ROLES.DRIVER && driver.role !== USER_ROLES.REPARTIDOR) {
        throw new InvalidRoleError('El usuario especificado no posee rol de repartidor/driver');
      }
    }

    if (newDelivery.status && !Object.values(DELIVERY_STATUS).includes(newDelivery.status)) {
      throw new InvalidStatusError('Estado de entrega inválido');
    }

    if (newDelivery.priority && !Object.values(DELIVERY_PRIORITY).includes(newDelivery.priority)) {
      throw new InvalidStatusError('Prioridad de entrega inválida');
    }

    return await deliveryRepository.create(newDelivery);
  }

  async updateDelivery(id, updates) {
    const delivery = await deliveryRepository.update(id, updates);
    if (!delivery) {
      throw new DeliveryNotFoundError('Entrega no encontrada');
    }
    return delivery;
  }

  async deleteDelivery(id) {
    const delivery = await deliveryRepository.delete(id);
    if (!delivery) {
      throw new DeliveryNotFoundError('Entrega no encontrada');
    }
    return { message: 'Entrega eliminada' };
  }
}

export const deliveryService = new DeliveryService();
export default deliveryService;
