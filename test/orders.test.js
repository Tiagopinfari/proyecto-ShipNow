import { expect } from 'chai';
import supertest from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/user.model.js';
import Order from '../src/models/order.model.js';
import { generateMockUser } from '../src/mocks/user.mock.js';
import { USER_ROLES, ORDER_STATUS, DELIVERY_PRIORITY } from '../src/constants/index.js';
import { ERROR_CODES } from '../src/utils/errorDictionary.js';

const requester = supertest(app);

describe('Tests Funcionales — Módulo Orders (/api/orders)', () => {
  let testCustomer;

  beforeEach(async () => {
    await Order.deleteMany({});
    await User.deleteMany({});
    testCustomer = await User.create(generateMockUser({ role: USER_ROLES.CUSTOMER }));
  });

  after(async () => {
    await Order.deleteMany({});
    await User.deleteMany({});
  });

  describe('Casos Exitosos', () => {
    it('POST /api/orders debe crear un pedido con datos válidos, calcular costo de envío y devolver 201', async () => {
      const orderPayload = {
        customer: testCustomer._id.toString(),
        items: [
          { name: 'Monitor Gamer 27', quantity: 2, price: 15000 },
          { name: 'Cable HDMI 2.1', quantity: 1, price: 5000 }
        ],
        deliveryAddress: 'Av. Corrientes 1234, CABA',
        priority: DELIVERY_PRIORITY.HIGH
      };

      const response = await requester.post('/api/orders').send(orderPayload);

      expect(response.status).to.equal(201);
      expect(response.body).to.be.an('object');
      expect(response.body).to.include.all.keys(
        '_id',
        'customer',
        'items',
        'deliveryAddress',
        'declaredValue',
        'shippingCost',
        'total',
        'status',
        'priority'
      );
      expect(response.body.items).to.be.an('array').with.lengthOf(2);
      expect(response.body.declaredValue).to.equal(35000);
      expect(response.body.shippingCost).to.equal(10);
      expect(response.body.total).to.equal(35010);
      expect(response.body.status).to.equal(ORDER_STATUS.CREATED);
      expect(response.body.priority).to.equal(DELIVERY_PRIORITY.HIGH);
    });

    it('GET /api/orders debe listar los pedidos registrados con status 200 y estructura completa', async () => {
      await requester.post('/api/orders').send({
        customer: testCustomer._id.toString(),
        items: [{ name: 'Notebook Pro', quantity: 1, price: 100000 }],
        deliveryAddress: 'Av. Santa Fe 3200, CABA'
      });

      const response = await requester.get('/api/orders');

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array').with.lengthOf(1);
      expect(response.body[0]).to.have.property('_id');
      expect(response.body[0]).to.have.property('deliveryAddress', 'Av. Santa Fe 3200, CABA');
      expect(response.body[0].customer).to.be.an('object');
      expect(response.body[0].customer.email).to.equal(testCustomer.email);
    });

    it('GET /api/orders/:id debe consultar un pedido por ID y devolver 200 con sus items y cliente', async () => {
      const createRes = await requester.post('/api/orders').send({
        customer: testCustomer._id.toString(),
        items: [{ name: 'Teclado Mecánico', quantity: 1, price: 25000 }],
        deliveryAddress: 'Av. Cabildo 2040, CABA'
      });

      const orderId = createRes.body._id;
      const response = await requester.get(`/api/orders/${orderId}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('object');
      expect(response.body._id).to.equal(orderId);
      expect(response.body.items).to.be.an('array').with.lengthOf(1);
      expect(response.body.items[0].name).to.equal('Teclado Mecánico');
    });

    it('PUT /api/orders/:id debe actualizar el estado y prioridad de un pedido válidamente y devolver 200', async () => {
      const createRes = await requester.post('/api/orders').send({
        customer: testCustomer._id.toString(),
        items: [{ name: 'Mouse Inalámbrico', quantity: 1, price: 12000 }],
        deliveryAddress: 'Calle Falsa 123'
      });

      const orderId = createRes.body._id;
      const response = await requester
        .put(`/api/orders/${orderId}`)
        .send({
          status: ORDER_STATUS.IN_TRANSIT,
          priority: DELIVERY_PRIORITY.HIGH
        });

      expect(response.status).to.equal(200);
      expect(response.body._id).to.equal(orderId);
      expect(response.body.status).to.equal(ORDER_STATUS.IN_TRANSIT);
      expect(response.body.priority).to.equal(DELIVERY_PRIORITY.HIGH);
    });

    it('DELETE /api/orders/:id debe eliminar un pedido existente y devolver 200', async () => {
      const createRes = await requester.post('/api/orders').send({
        customer: testCustomer._id.toString(),
        items: [{ name: 'Silla Ergonómica', quantity: 1, price: 80000 }],
        deliveryAddress: 'Av. Rivadavia 5000'
      });

      const response = await requester.delete(`/api/orders/${createRes.body._id}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('message', 'Pedido eliminado');
    });
  });

  describe('Casos de Error Esperados', () => {
    it('POST /api/orders sin items debe responder 400 y formato de error uniforme (VALIDATION_ERROR)', async () => {
      const response = await requester.post('/api/orders').send({
        customer: testCustomer._id.toString(),
        items: [],
        deliveryAddress: 'Av. Corrientes 1234'
      });

      expect(response.status).to.equal(400);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.VALIDATION_ERROR
      });
      expect(response.body.message).to.include('item');
    });

    it('POST /api/orders con cliente inexistente debe responder 404 y código USER_NOT_FOUND', async () => {
      const nonExistentCustomerId = new mongoose.Types.ObjectId();

      const response = await requester.post('/api/orders').send({
        customer: nonExistentCustomerId.toString(),
        items: [{ name: 'Producto X', quantity: 1, price: 1000 }],
        deliveryAddress: 'Av. Corrientes 1234'
      });

      expect(response.status).to.equal(404);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.USER_NOT_FOUND
      });
    });

    it('POST /api/orders con estado inválido debe responder 400 y código INVALID_STATUS', async () => {
      const response = await requester.post('/api/orders').send({
        customer: testCustomer._id.toString(),
        items: [{ name: 'Producto X', quantity: 1, price: 1000 }],
        deliveryAddress: 'Av. Corrientes 1234',
        status: 'estado_inexistente'
      });

      expect(response.status).to.equal(400);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.INVALID_STATUS
      });
    });

    it('PUT /api/orders/:id con estado inválido debe responder 400 y código INVALID_STATUS', async () => {
      const createRes = await requester.post('/api/orders').send({
        customer: testCustomer._id.toString(),
        items: [{ name: 'Producto Valido', quantity: 1, price: 2000 }],
        deliveryAddress: 'Av. Corrientes 1234'
      });

      const response = await requester
        .put(`/api/orders/${createRes.body._id}`)
        .send({ status: 'estado_invalido_123' });

      expect(response.status).to.equal(400);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.INVALID_STATUS
      });
    });

    it('GET /api/orders/:id de un pedido inexistente debe responder 404 y código ORDER_NOT_FOUND', async () => {
      const fakeOrderId = new mongoose.Types.ObjectId();

      const response = await requester.get(`/api/orders/${fakeOrderId}`);

      expect(response.status).to.equal(404);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.ORDER_NOT_FOUND
      });
    });
  });
});
