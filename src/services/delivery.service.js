import deliveryRepository from '../repositories/delivery.repository.js';
import orderRepository from '../repositories/order.repository.js';
import userRepository from '../repositories/user.repository.js';
import {
  DeliveryNotFoundError,
  OrderNotFoundError,
  UserNotFoundError,
  InvalidRoleError,
  InvalidStatusError,
  ValidationError,
  FileRequiredError,
  InvalidDocumentTypeError
} from '../utils/errors.js';
import logger from '../config/logger.js';
import { finalizeUploadedFileAsync, removeUploadedFileAsync } from '../config/multer.config.js';
import { parsePaginationParams } from '../utils/pagination.js';
import { USER_ROLES, DELIVERY_STATUS, DELIVERY_PRIORITY, DOCUMENT_TYPES } from '../constants/index.js';

class DeliveryService {
  async getDeliveries(queryParams = {}) {
    const { page, limit, skip } = parsePaginationParams(queryParams);
    const filter = {};

    if (queryParams.status) {
      if (!Object.values(DELIVERY_STATUS).includes(queryParams.status)) {
        throw new InvalidStatusError('Filtro de estado de entrega inválido');
      }
      filter.status = queryParams.status;
    }

    if (queryParams.priority) {
      if (!Object.values(DELIVERY_PRIORITY).includes(queryParams.priority)) {
        throw new InvalidStatusError('Filtro de prioridad de entrega inválida');
      }
      filter.priority = queryParams.priority;
    }

    if (queryParams.driver) {
      filter.driver = queryParams.driver;
    }

    if (queryParams.order) {
      filter.order = queryParams.order;
    }

    return await deliveryRepository.getAll(filter, { limit, skip, page });
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
    if (!newDelivery || !newDelivery.order) {
      throw new ValidationError('El pedido (order) es obligatorio para crear una entrega');
    }

    if (newDelivery.status && !Object.values(DELIVERY_STATUS).includes(newDelivery.status)) {
      throw new InvalidStatusError('Estado de entrega inválido');
    }

    if (newDelivery.priority && !Object.values(DELIVERY_PRIORITY).includes(newDelivery.priority)) {
      throw new InvalidStatusError('Prioridad de entrega inválida');
    }

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

    const createdDelivery = await deliveryRepository.create(newDelivery);
    logger.info(`Entrega creada exitosamente con ID: ${createdDelivery._id} (Pedido: ${createdDelivery.order})`);
    return createdDelivery;
  }

  async updateDelivery(id, updates) {
    if (updates.status && !Object.values(DELIVERY_STATUS).includes(updates.status)) {
      throw new InvalidStatusError('Estado de entrega inválido');
    }

    if (updates.priority && !Object.values(DELIVERY_PRIORITY).includes(updates.priority)) {
      throw new InvalidStatusError('Prioridad de entrega inválida');
    }

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

  async uploadProof(id, { file, documentType }) {
    if (!file) {
      logger.warning(`Intento de subir comprobante a entrega ID ${id} sin archivo`);
      throw new FileRequiredError('El archivo es obligatorio para registrar un comprobante de entrega');
    }

    const activeDocType = documentType ? String(documentType).trim() : DOCUMENT_TYPES.DELIVERY_PROOF;
    if (!Object.values(DOCUMENT_TYPES).includes(activeDocType)) {
      await removeUploadedFileAsync(file);
      logger.warning(`Tipo de documento inválido en comprobante de entrega ID ${id}: "${documentType}"`);
      throw new InvalidDocumentTypeError(
        `Tipo de documento inválido ("${documentType}"). Valores permitidos: ${Object.values(DOCUMENT_TYPES).join(', ')}`
      );
    }

    let delivery;
    try {
      delivery = await deliveryRepository.getById(id);
    } catch (err) {
      await removeUploadedFileAsync(file);
      throw err;
    }

    if (!delivery) {
      await removeUploadedFileAsync(file);
      logger.warning(`Fallo al asociar comprobante: entrega inexistente ID ${id}`);
      throw new DeliveryNotFoundError('Entrega no encontrada');
    }

    const metadata = await finalizeUploadedFileAsync({
      file,
      documentType: activeDocType,
      entityPrefix: `delivery-${id}`
    });

    const currentProofs = Array.isArray(delivery.proofs) ? [...delivery.proofs] : [];
    currentProofs.push(metadata);

    const updatedDelivery = await deliveryRepository.update(id, {
      proof: metadata,
      proofs: currentProofs
    });

    logger.info(`Comprobante "${metadata.originalName}" asociado exitosamente a la entrega ID ${id}`);

    return {
      message: 'Comprobante de entrega cargado y asociado exitosamente',
      proof: metadata,
      delivery: updatedDelivery
    };
  }
}

export const deliveryService = new DeliveryService();
export default deliveryService;
