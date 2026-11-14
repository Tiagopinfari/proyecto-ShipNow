import orderRepository from '../repositories/order.repository.js';
import userRepository from '../repositories/user.repository.js';
import {
  OrderNotFoundError,
  UserNotFoundError,
  ValidationError,
  InvalidStatusError,
  FileRequiredError,
  InvalidDocumentTypeError
} from '../utils/errors.js';
import config from '../config/env.config.js';
import logger from '../config/logger.js';
import { persistUploadedFile } from '../config/multer.config.js';
import { ORDER_STATUS, DELIVERY_PRIORITY, DOCUMENT_TYPES } from '../constants/index.js';
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
    if (!newOrder || !newOrder.customer) {
      throw new ValidationError('El cliente (customer) es obligatorio para crear un pedido');
    }

    if (!newOrder.deliveryAddress || String(newOrder.deliveryAddress).trim() === '') {
      throw new ValidationError('La dirección de entrega (deliveryAddress) es obligatoria');
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

    const customer = await userRepository.getById(newOrder.customer);
    if (!customer) {
      logger.warning(`Fallo al crear pedido: cliente inexistente ID ${newOrder.customer}`);
      throw new UserNotFoundError('El cliente especificado no existe');
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
      status: newOrder.status || ORDER_STATUS.CREATED,
      priority: newOrder.priority || DELIVERY_PRIORITY.NORMAL
    });

    logger.info(`Pedido creado exitosamente con ID: ${createdOrder._id} (total: $${createdOrder.total})`);
    return createdOrder;
  }

  async updateOrder(id, updates) {
    if (updates.status && !Object.values(ORDER_STATUS).includes(updates.status)) {
      throw new InvalidStatusError('Estado de pedido inválido');
    }

    if (updates.priority && !Object.values(DELIVERY_PRIORITY).includes(updates.priority)) {
      throw new InvalidStatusError('Prioridad de pedido inválida');
    }

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

  async uploadProof(id, { file, documentType }) {
    if (!file) {
      logger.warning(`Intento de subir comprobante a pedido ID ${id} sin archivo`);
      throw new FileRequiredError('El archivo es obligatorio para registrar un comprobante de pedido');
    }

    const activeDocType = documentType ? String(documentType).trim() : DOCUMENT_TYPES.DELIVERY_PROOF;
    if (!Object.values(DOCUMENT_TYPES).includes(activeDocType)) {
      logger.warning(`Tipo de documento inválido en comprobante de pedido ID ${id}: "${documentType}"`);
      throw new InvalidDocumentTypeError(
        `Tipo de documento inválido ("${documentType}"). Valores permitidos: ${Object.values(DOCUMENT_TYPES).join(', ')}`
      );
    }

    const order = await orderRepository.getById(id);
    if (!order) {
      logger.warning(`Fallo al asociar comprobante: pedido inexistente ID ${id}`);
      throw new OrderNotFoundError('Pedido no encontrado');
    }

    const metadata = persistUploadedFile({
      file,
      documentType: activeDocType,
      entityPrefix: `order-${id}`
    });

    const currentProofs = Array.isArray(order.proofs) ? [...order.proofs] : [];
    currentProofs.push(metadata);

    const updatedOrder = await orderRepository.update(id, {
      proof: metadata,
      proofs: currentProofs
    });

    logger.info(`Comprobante "${metadata.originalName}" asociado exitosamente al pedido ID ${id}`);

    return {
      message: 'Comprobante de pedido cargado y asociado exitosamente',
      proof: metadata,
      order: updatedOrder
    };
  }
}

export const orderService = new OrderService();
export default orderService;
