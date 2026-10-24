import { generateMockUsers } from '../mocks/user.mock.js';
import { generateMockOrders } from '../mocks/order.mock.js';
import { generateMockDeliveries } from '../mocks/delivery.mock.js';
import userRepository from '../repositories/user.repository.js';
import orderRepository from '../repositories/order.repository.js';
import deliveryRepository from '../repositories/delivery.repository.js';
import logger from '../config/logger.js';
import { USER_ROLES, DELIVERY_STATUS } from '../constants/index.js';
import {
  InvalidQuantityError,
  ValidationError,
  DatabaseOperationError
} from '../utils/errors.js';

const MAX_MOCK_ITEMS = 400;
const DEFAULT_MOCK_ITEMS = 10;

const validateQty = (qty = DEFAULT_MOCK_ITEMS, paramName = 'qty') => {
  const parsedQty = Number(qty);
  if (!Number.isInteger(parsedQty)) {
    logger.warning(`Cantidad inválida para mocks (${paramName} no entero): ${qty}`);
    throw new InvalidQuantityError(`${paramName} debe ser un número entero válido`);
  }
  if (parsedQty < 0) {
    logger.warning(`Cantidad negativa para mocks (${paramName}): ${qty}`);
    throw new InvalidQuantityError(`${paramName} no puede ser negativo`);
  }
  if (parsedQty > MAX_MOCK_ITEMS) {
    logger.warning(`Cantidad excedida para mocks (${paramName} > ${MAX_MOCK_ITEMS}): ${qty}`);
    throw new InvalidQuantityError(`${paramName} no puede superar ${MAX_MOCK_ITEMS}`);
  }
  return parsedQty;
};

class MockService {
  getMockUsers(qty) {
    const validQty = validateQty(qty);
    logger.info(`Generando ${validQty} usuarios simulados en memoria`);
    const users = generateMockUsers(validQty);
    return users.map((u) => ({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      password: u.password
    }));
  }

  getMockOrders(qty) {
    const validQty = validateQty(qty);
    logger.info(`Generando ${validQty} pedidos simulados en memoria`);
    return generateMockOrders(validQty);
  }

  getMockDeliveries(qty) {
    const validQty = validateQty(qty);
    logger.info(`Generando ${validQty} entregas simuladas en memoria`);
    return generateMockDeliveries(validQty);
  }

  getMockAll(qty) {
    const validQty = validateQty(qty);
    logger.info(`Generando conjunto completo de datos simulados en memoria (base: ${validQty})`);
    const customers = generateMockUsers(validQty, { role: USER_ROLES.CUSTOMER });
    const drivers = generateMockUsers(Math.max(1, Math.floor(validQty / 2)), { role: USER_ROLES.DRIVER });
    const orders = generateMockOrders(validQty);
    const deliveries = generateMockDeliveries(validQty);

    return {
      usuarios: customers.concat(drivers),
      pedidos: orders,
      entregas: deliveries
    };
  }

  async seed({ qty = DEFAULT_MOCK_ITEMS, collection = 'usuarios' } = {}) {
    const parsedQty = validateQty(qty);
    if (parsedQty === 0) {
      logger.warning('Intento de seed con qty=0');
      throw new InvalidQuantityError('qty debe ser mayor a 0 para realizar la carga de datos');
    }

    const normalizedCollection = (collection || 'usuarios').toLowerCase();
    logger.info(`Iniciando seed de datos de prueba: ${parsedQty} registros en colección "${normalizedCollection}"`);

    try {
      if (normalizedCollection === 'usuarios' || normalizedCollection === 'users') {
        const mockUsers = generateMockUsers(parsedQty);
        const insertedUsers = await userRepository.insertMany(mockUsers);
        logger.info(`Seed exitoso: ${insertedUsers.length} usuarios insertados en MongoDB`);
        return {
          insertados: insertedUsers.length,
          coleccion: 'usuarios'
        };
      }

      if (normalizedCollection === 'pedidos' || normalizedCollection === 'orders') {
        const mockCustomers = generateMockUsers(parsedQty, { role: USER_ROLES.CUSTOMER });
        const insertedCustomers = await userRepository.insertMany(mockCustomers);

        const mockOrders = insertedCustomers.map((cust) =>
          generateMockOrders(1, { customerId: cust._id })[0]
        );
        const insertedOrders = await orderRepository.insertMany(mockOrders);
        logger.info(`Seed exitoso: ${insertedOrders.length} pedidos insertados en MongoDB`);

        return {
          insertados: insertedOrders.length,
          coleccion: 'pedidos'
        };
      }

      if (normalizedCollection === 'entregas' || normalizedCollection === 'deliveries') {
        const mockCustomers = generateMockUsers(parsedQty, { role: USER_ROLES.CUSTOMER });
        const mockDrivers = generateMockUsers(Math.max(1, Math.ceil(parsedQty / 2)), { role: USER_ROLES.DRIVER });

        const insertedCustomers = await userRepository.insertMany(mockCustomers);
        const insertedDrivers = await userRepository.insertMany(mockDrivers);

        const mockOrders = insertedCustomers.map((cust) =>
          generateMockOrders(1, { customerId: cust._id })[0]
        );
        const insertedOrders = await orderRepository.insertMany(mockOrders);

        const mockDeliveries = insertedOrders.map((ord, idx) => {
          const driver = insertedDrivers[idx % insertedDrivers.length];
          return generateMockDeliveries(1, {
            orderId: ord._id,
            driverId: driver._id,
            status: DELIVERY_STATUS.ASSIGNED
          })[0];
        });
        const insertedDeliveries = await deliveryRepository.insertMany(mockDeliveries);
        logger.info(`Seed exitoso: ${insertedDeliveries.length} entregas insertadas en MongoDB`);

        return {
          insertados: insertedDeliveries.length,
          coleccion: 'entregas'
        };
      }

      if (normalizedCollection === 'all' || normalizedCollection === 'completo') {
        const mockCustomers = generateMockUsers(parsedQty, { role: USER_ROLES.CUSTOMER });
        const mockDrivers = generateMockUsers(Math.max(1, Math.ceil(parsedQty / 2)), { role: USER_ROLES.DRIVER });

        const insertedCustomers = await userRepository.insertMany(mockCustomers);
        const insertedDrivers = await userRepository.insertMany(mockDrivers);

        const mockOrders = insertedCustomers.map((cust) =>
          generateMockOrders(1, { customerId: cust._id })[0]
        );
        const insertedOrders = await orderRepository.insertMany(mockOrders);

        const mockDeliveries = insertedOrders.map((ord, idx) => {
          const driver = insertedDrivers[idx % insertedDrivers.length];
          return generateMockDeliveries(1, {
            orderId: ord._id,
            driverId: driver._id,
            status: DELIVERY_STATUS.ASSIGNED
          })[0];
        });
        const insertedDeliveries = await deliveryRepository.insertMany(mockDeliveries);

        const totalResult = {
          insertados: {
            usuarios: insertedCustomers.length + insertedDrivers.length,
            pedidos: insertedOrders.length,
            entregas: insertedDeliveries.length
          },
          coleccion: 'completo'
        };
        logger.info(`Seed completo exitoso: ${JSON.stringify(totalResult.insertados)}`);
        return totalResult;
      }
    } catch (error) {
      if (error instanceof InvalidQuantityError || error instanceof ValidationError) {
        throw error;
      }
      logger.error(`Falla en seed al persistir en MongoDB: ${error.message}`);
      throw new DatabaseOperationError(`Error al insertar datos en MongoDB: ${error.message}`);
    }

    logger.warning(`Colección inválida solicitada en seed: ${collection}`);
    throw new ValidationError(`Colección inválida: ${collection}. Opciones válidas: usuarios, pedidos, entregas, all`);
  }
}

export const mockService = new MockService();
export default mockService;
