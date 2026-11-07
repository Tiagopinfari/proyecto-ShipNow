import { expect } from 'chai';
import supertest from 'supertest';
import app from '../src/app.js';
import User from '../src/models/user.model.js';
import Order from '../src/models/order.model.js';
import Delivery from '../src/models/delivery.model.js';
import { ERROR_CODES } from '../src/utils/errorDictionary.js';

const requester = supertest(app);

describe('Tests Funcionales — Módulo Mocks (/api/mocks)', () => {
  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Order.deleteMany({}),
      Delivery.deleteMany({})
    ]);
  });

  after(async () => {
    await Promise.all([
      User.deleteMany({}),
      Order.deleteMany({}),
      Delivery.deleteMany({})
    ]);
  });

  describe('Casos Exitosos', () => {
    it('GET /api/mocks/users?qty=4 debe generar 4 usuarios en memoria sin guardarlos en la base de datos', async () => {
      const response = await requester.get('/api/mocks/users?qty=4');

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array').with.lengthOf(4);
      expect(response.body[0]).to.include.all.keys('firstName', 'lastName', 'email', 'role', 'password');

      const dbCount = await User.countDocuments();
      expect(dbCount).to.equal(0);
    });

    it('GET /api/mocks/mockingUsers?qty=3 (alias) debe devolver 3 usuarios simulados con estructura válida', async () => {
      const response = await requester.get('/api/mocks/mockingUsers?qty=3');

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array').with.lengthOf(3);
      expect(response.body[0]).to.include.all.keys('firstName', 'lastName', 'email', 'role');
    });

    it('GET /api/mocks/orders?qty=3 debe devolver 3 pedidos simulados con items y costos calculados', async () => {
      const response = await requester.get('/api/mocks/orders?qty=3');

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array').with.lengthOf(3);
      expect(response.body[0]).to.include.all.keys(
        'customer',
        'items',
        'deliveryAddress',
        'shippingCost',
        'total',
        'status',
        'priority'
      );
    });

    it('POST /api/mocks/seed debe insertar datos de prueba en MongoDB de forma controlada y devolver 201', async () => {
      const response = await requester
        .post('/api/mocks/seed')
        .send({ qty: 3, collection: 'usuarios' });

      expect(response.status).to.equal(201);
      expect(response.body).to.deep.equal({
        insertados: 3,
        coleccion: 'usuarios'
      });

      const dbCount = await User.countDocuments();
      expect(dbCount).to.equal(3);
    });
  });

  describe('Casos de Error Esperados', () => {
    it('GET /api/mocks/users?qty=-5 con cantidad negativa debe responder 400 y código INVALID_QUANTITY', async () => {
      const response = await requester.get('/api/mocks/users?qty=-5');

      expect(response.status).to.equal(400);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.INVALID_QUANTITY
      });
    });

    it('GET /api/mocks/orders?qty=abc con cantidad no numérica debe responder 400 y código INVALID_QUANTITY', async () => {
      const response = await requester.get('/api/mocks/orders?qty=abc');

      expect(response.status).to.equal(400);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.INVALID_QUANTITY
      });
    });

    it('GET /api/mocks/deliveries?qty=999 superando el límite máximo debe responder 400 y código INVALID_QUANTITY', async () => {
      const response = await requester.get('/api/mocks/deliveries?qty=999');

      expect(response.status).to.equal(400);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.INVALID_QUANTITY
      });
    });

    it('POST /api/mocks/seed con qty=0 debe responder 400 y código INVALID_QUANTITY', async () => {
      const response = await requester
        .post('/api/mocks/seed')
        .send({ qty: 0, collection: 'usuarios' });

      expect(response.status).to.equal(400);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.INVALID_QUANTITY
      });
    });

    it('POST /api/mocks/seed con colección inexistente debe responder 400 y código VALIDATION_ERROR', async () => {
      const response = await requester
        .post('/api/mocks/seed')
        .send({ qty: 2, collection: 'coleccion_invalida' });

      expect(response.status).to.equal(400);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.VALIDATION_ERROR
      });
    });
  });
});
