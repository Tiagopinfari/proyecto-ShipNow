import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';
import { DELIVERY_STATUS, DELIVERY_PRIORITY } from '../constants/index.js';

export const generateMockDelivery = (options = {}) => {
  const status = options.status || faker.helpers.arrayElement(Object.values(DELIVERY_STATUS));
  const priority = options.priority || faker.helpers.arrayElement(Object.values(DELIVERY_PRIORITY));
  const orderId = options.orderId || new mongoose.Types.ObjectId();
  const driverId = options.driverId || new mongoose.Types.ObjectId();

  const assignedAt = [DELIVERY_STATUS.ASSIGNED, DELIVERY_STATUS.IN_TRANSIT, DELIVERY_STATUS.DELIVERED].includes(status)
    ? faker.date.recent({ days: 3 })
    : null;

  const deliveredAt = status === DELIVERY_STATUS.DELIVERED
    ? faker.date.recent({ days: 1 })
    : null;

  return {
    order: orderId,
    driver: driverId,
    status,
    priority,
    assignedAt,
    deliveredAt
  };
};

export const generateMockDeliveries = (qty = 10, options = {}) => {
  return Array.from({ length: qty }, () => generateMockDelivery(options));
};
