import { expect } from 'chai';
import supertest from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/user.model.js';
import Order from '../src/models/order.model.js';
import Delivery from '../src/models/delivery.model.js';
import { generateMockUser } from '../src/mocks/user.mock.js';
import { USER_ROLES, DELIVERY_STATUS, DELIVERY_PRIORITY } from '../src/constants/index.js';
import { ERROR_CODES } from '../src/utils/errorDictionary.js';

const requester = supertest(app);

describe('Tests Funcionales — Módulo Deliveries (/api/deliveries)', () => {
  let testCustomer;
  let testDriver;
  let testOrder;

  beforeEach(async () => {
    await Delivery.deleteMany({});
    await Order.deleteMany({});
    await User.deleteMany({});

    testCustomer = await User.create(generateMockUser({ role: USER_ROLES.CUSTOMER }));
    testDriver = await User.create(generateMockUser({ role: USER_ROLES.DRIVER }));
    testOrder = await Order.create({
      customer: testCustomer._id,
      items: [{ name: 'Paquete Express', quantity: 1, price: 5000 }],
      deliveryAddress: 'Av. Libertador 1000, CABA',
      declaredValue: 5000,
      shippingCost: 10,
      total: 5010
    });
  });

  after(async () => {
    await Delivery.deleteMany({});
    await Order.deleteMany({});
    await User.deleteMany({});
  });

  describe('Casos Exitosos', () => {
    it('POST /api/deliveries debe crear una entrega vinculada a un pedido y repartidor válido con status 201', async () => {
      const response = await requester.post('/api/deliveries').send({
        order: testOrder._id.toString(),
        driver: testDriver._id.toString(),
        status: DELIVERY_STATUS.ASSIGNED,
        priority: DELIVERY_PRIORITY.HIGH
      });

      expect(response.status).to.equal(201);
      expect(response.body).to.include.all.keys('_id', 'order', 'driver', 'status', 'priority');
      expect(response.body.order).to.equal(testOrder._id.toString());
      expect(response.body.driver).to.equal(testDriver._id.toString());
      expect(response.body.status).to.equal(DELIVERY_STATUS.ASSIGNED);
    });

    it('PUT /api/deliveries/:id debe actualizar el estado de la entrega a delivered con status 200', async () => {
      const created = await Delivery.create({
        order: testOrder._id,
        driver: testDriver._id,
        status: DELIVERY_STATUS.ASSIGNED
      });

      const response = await requester
        .put(`/api/deliveries/${created._id}`)
        .send({ status: DELIVERY_STATUS.DELIVERED });

      expect(response.status).to.equal(200);
      expect(response.body.status).to.equal(DELIVERY_STATUS.DELIVERED);
    });
  });

  describe('Casos de Error Esperados', () => {
    it('POST /api/deliveries asignando un usuario que NO es repartidor debe responder 400 (INVALID_USER_ROLE)', async () => {
      const response = await requester.post('/api/deliveries').send({
        order: testOrder._id.toString(),
        driver: testCustomer._id.toString(),
        status: DELIVERY_STATUS.ASSIGNED
      });

      expect(response.status).to.equal(400);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.INVALID_USER_ROLE
      });
    });

    it('PUT /api/deliveries/:id con estado inválido debe responder 400 (INVALID_STATUS)', async () => {
      const created = await Delivery.create({
        order: testOrder._id,
        driver: testDriver._id
      });

      const response = await requester
        .put(`/api/deliveries/${created._id}`)
        .send({ status: 'estado_falso' });

      expect(response.status).to.equal(400);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.INVALID_STATUS
      });
    });

    it('GET /api/deliveries/:id de una entrega inexistente debe responder 404 (DELIVERY_NOT_FOUND)', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await requester.get(`/api/deliveries/${fakeId}`);

      expect(response.status).to.equal(404);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.DELIVERY_NOT_FOUND
      });
    });
  });
});
