import deliveryRepository from '../repositories/delivery.repository.js';
import orderRepository from '../repositories/order.repository.js';
import userRepository from '../repositories/user.repository.js';
import { AppError } from '../utils/errors.js';
import { USER_ROLES } from '../constants/index.js';

class DeliveryService {
  async getDeliveries() {
    return await deliveryRepository.getAll();
  }

  async getDeliveryById(id) {
    const delivery = await deliveryRepository.getById(id);
    if (!delivery) {
      throw new AppError('Entrega no encontrada', 404);
    }
    return delivery;
  }

  async createDelivery(newDelivery) {
    const order = await orderRepository.getById(newDelivery.order);
    if (!order) {
      throw new AppError('El pedido especificado no existe', 400);
    }

    if (newDelivery.driver) {
      const driver = await userRepository.getById(newDelivery.driver);
      if (!driver) {
        throw new AppError('El repartidor especificado no existe', 400);
      }
      if (driver.role !== USER_ROLES.DRIVER && driver.role !== USER_ROLES.REPARTIDOR) {
        throw new AppError('El usuario no es repartidor/driver', 400);
      }
    }

    return await deliveryRepository.create(newDelivery);
  }

  async updateDelivery(id, updates) {
    const delivery = await deliveryRepository.update(id, updates);
    if (!delivery) {
      throw new AppError('Entrega no encontrada', 404);
    }
    return delivery;
  }

  async deleteDelivery(id) {
    const delivery = await deliveryRepository.delete(id);
    if (!delivery) {
      throw new AppError('Entrega no encontrada', 404);
    }
    return { message: 'Entrega eliminada' };
  }
}

export const deliveryService = new DeliveryService();
export default deliveryService;
