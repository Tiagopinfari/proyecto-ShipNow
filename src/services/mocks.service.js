import { generateMockUsers } from '../mocks/user.mock.js';
import { generateMockOrders } from '../mocks/order.mock.js';
import { generateMockDeliveries } from '../mocks/delivery.mock.js';
import userRepository from '../repositories/user.repository.js';
import orderRepository from '../repositories/order.repository.js';
import deliveryRepository from '../repositories/delivery.repository.js';
import { USER_ROLES, ORDER_STATUS, DELIVERY_STATUS } from '../constants/index.js';
import { AppError } from '../utils/errors.js';

const MAX_MOCK_ITEMS = 400;
const DEFAULT_MOCK_ITEMS = 10;

const validateQty = (qty = DEFAULT_MOCK_ITEMS) => {
  const parsedQty = Number(qty);
  if (!Number.isInteger(parsedQty) || parsedQty < 0) {
    throw new AppError('qty debe ser un número entero mayor o igual a 0', 400);
  }
  if (parsedQty > MAX_MOCK_ITEMS) {
    throw new AppError(`qty no puede superar ${MAX_MOCK_ITEMS}`, 400);
  }
  return parsedQty;
};

class MockService {
  /**
   * Genera usuarios de prueba en memoria sin guardarlos en MongoDB.
   * Retorna formato exacto requerido con nombre, email y rol.
   */
  getMockUsers(qty) {
    const validQty = validateQty(qty);
    const users = generateMockUsers(validQty);
    return users.map((u) => ({
      nombre: u.nombre,
      email: u.email,
      rol: u.rol
    }));
  }

  /**
   * Genera pedidos de prueba en memoria sin guardarlos.
   */
  getMockOrders(qty) {
    const validQty = validateQty(qty);
    return generateMockOrders(validQty);
  }

  /**
   * Genera entregas de prueba en memoria sin guardarlas.
   */
  getMockDeliveries(qty) {
    const validQty = validateQty(qty);
    return generateMockDeliveries(validQty);
  }

  /**
   * Genera un conjunto simulado completo en memoria respetando relaciones
   */
  getMockAll(qty) {
    const validQty = validateQty(qty);
    const customers = generateMockUsers(validQty, { role: USER_ROLES.CUSTOMER });
    const drivers = generateMockUsers(Math.max(1, Math.floor(validQty / 2)), { role: USER_ROLES.DRIVER });
    const orders = generateMockOrders(validQty);
    const deliveries = generateMockDeliveries(validQty);

    return {
      usuarios: customers.concat(drivers).map((u) => ({ nombre: u.nombre, email: u.email, rol: u.rol })),
      pedidos: orders,
      entregas: deliveries
    };
  }

  /**
   * Inserta registros de prueba en MongoDB de forma controlada respetando relaciones.
   */
  async seed({ qty = DEFAULT_MOCK_ITEMS, collection = 'usuarios' } = {}) {
    const parsedQty = validateQty(qty);
    if (parsedQty === 0) {
      throw new AppError('qty debe ser mayor a 0', 400);
    }

    const normalizedCollection = (collection || 'usuarios').toLowerCase();

    // 1. Carga de usuarios (colección por defecto requerida en el briefing)
    if (normalizedCollection === 'usuarios' || normalizedCollection === 'users') {
      const mockUsers = generateMockUsers(parsedQty);
      const insertedUsers = await userRepository.insertMany(mockUsers);
      return {
        insertados: insertedUsers.length,
        coleccion: 'usuarios'
      };
    }

    // 2. Carga de pedidos (crea clientes y les asocia pedidos)
    if (normalizedCollection === 'pedidos' || normalizedCollection === 'orders') {
      const mockCustomers = generateMockUsers(parsedQty, { role: USER_ROLES.CUSTOMER });
      const insertedCustomers = await userRepository.insertMany(mockCustomers);

      const mockOrders = insertedCustomers.map((cust) =>
        generateMockOrders(1, { customerId: cust._id })[0]
      );
      const insertedOrders = await orderRepository.insertMany(mockOrders);

      return {
        insertados: insertedOrders.length,
        coleccion: 'pedidos'
      };
    }

    // 3. Carga de entregas (crea clientes, drivers, pedidos y entregas asociadas)
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

      return {
        insertados: insertedDeliveries.length,
        coleccion: 'entregas'
      };
    }

    // 4. Carga completa interrelacionada
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

      return {
        insertados: {
          usuarios: insertedCustomers.length + insertedDrivers.length,
          pedidos: insertedOrders.length,
          entregas: insertedDeliveries.length
        },
        coleccion: 'completo'
      };
    }

    throw new AppError(`Colección inválida: ${collection}. Opciones válidas: usuarios, pedidos, entregas, all`, 400);
  }
}

export const mockService = new MockService();
export default mockService;
