import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';
import { USER_ROLES } from '../constants/index.js';

export const generateMockUser = (options = {}) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const username = faker.internet.username({ firstName, lastName }).toLowerCase();
  const randomSuffix = faker.string.alphanumeric(5).toLowerCase();
  const email = `${username}.${randomSuffix}@shipnow.test`;
  const password = 'coder123!';

  // Distribución coherente: 3 clientes por cada 1 repartidor
  const role = options.role || faker.helpers.weightedArrayElement([
    { weight: 3, value: USER_ROLES.CUSTOMER },
    { weight: 1, value: USER_ROLES.DRIVER }
  ]);

  return {
    _id: options.withId ? new mongoose.Types.ObjectId() : undefined,
    firstName,
    lastName,
    email,
    password,
    role
  };
};

export const generateMockUsers = (qty = 10, options = {}) => {
  return Array.from({ length: qty }, () => generateMockUser(options));
};
