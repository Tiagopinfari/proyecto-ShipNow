import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';
import { ORDER_STATUS, DELIVERY_PRIORITY } from '../constants/index.js';

export const generateMockOrderItem = () => {
  return {
    name: faker.commerce.productName(),
    quantity: faker.number.int({ min: 1, max: 5 }),
    price: parseFloat(faker.commerce.price({ min: 500, max: 20000 }))
  };
};

export const generateMockOrder = (options = {}) => {
  const itemsCount = faker.number.int({ min: 1, max: 4 });
  const items = Array.from({ length: itemsCount }, generateMockOrderItem);
  const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const declaredValue = itemsTotal;
  const shippingCost = 10;
  const total = itemsTotal + shippingCost;

  const status = options.status || faker.helpers.arrayElement(Object.values(ORDER_STATUS));
  const priority = options.priority || faker.helpers.arrayElement(Object.values(DELIVERY_PRIORITY));
  const customerId = options.customerId || new mongoose.Types.ObjectId();

  return {
    customer: customerId,
    items,
    deliveryAddress: `${faker.location.streetAddress()}, ${faker.location.city()}`,
    declaredValue,
    shippingCost,
    total,
    status,
    priority,
    delivery: options.deliveryId || null
  };
};

export const generateMockOrders = (qty = 10, options = {}) => {
  return Array.from({ length: qty }, () => generateMockOrder(options));
};
