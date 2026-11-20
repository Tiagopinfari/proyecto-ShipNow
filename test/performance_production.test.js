import { expect } from 'chai';
import supertest from 'supertest';
import app from '../src/app.js';
import User from '../src/models/user.model.js';
import Order from '../src/models/order.model.js';
import Delivery from '../src/models/delivery.model.js';
import { generateMockUsers } from '../src/mocks/user.mock.js';
import { USER_ROLES, ORDER_STATUS, DELIVERY_PRIORITY, DELIVERY_STATUS } from '../src/constants/index.js';
import { ERROR_CODES } from '../src/utils/errorDictionary.js';
import { validateEnvVariables } from '../src/config/env.config.js';

const requester = supertest(app);

describe('Tests Funcionales — Módulo 8 (Performance, Paginación, Health Check y Producción)', () => {
  beforeEach(async () => {
    await Promise.all([
      Delivery.deleteMany({}),
      Order.deleteMany({}),
      User.deleteMany({})
    ]);
  });

  after(async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.ENABLE_INTERNAL_ENDPOINTS_IN_PROD;
    delete process.env.ENABLE_SWAGGER_IN_PROD;
    await Promise.all([
      Delivery.deleteMany({}),
      Order.deleteMany({}),
      User.deleteMany({})
    ]);
  });

  describe('Performance: Paginación, Límites y Filtros en Listados', () => {
    it('GET /api/users?page=1&limit=3 y ?page=2&limit=3 deben paginar resultados sin devolver la colección completa', async () => {
      const mockUsers = generateMockUsers(7, { role: USER_ROLES.CUSTOMER });
      await User.insertMany(mockUsers);

      const page1Res = await requester.get('/api/users?page=1&limit=3');
      const page2Res = await requester.get('/api/users?page=2&limit=3');
      const page3Res = await requester.get('/api/users?page=3&limit=3');

      expect(page1Res.status).to.equal(200);
      expect(page1Res.body).to.be.an('array').with.lengthOf(3);

      expect(page2Res.status).to.equal(200);
      expect(page2Res.body).to.be.an('array').with.lengthOf(3);

      expect(page3Res.status).to.equal(200);
      expect(page3Res.body).to.be.an('array').with.lengthOf(1);
    });

    it('GET /api/users?role=driver debe filtrar correctamente los usuarios por rol', async () => {
      const customers = generateMockUsers(3, { role: USER_ROLES.CUSTOMER });
      const drivers = generateMockUsers(2, { role: USER_ROLES.DRIVER });
      await User.insertMany([...customers, ...drivers]);

      const response = await requester.get(`/api/users?role=${USER_ROLES.DRIVER}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array').with.lengthOf(2);
      response.body.forEach((u) => expect(u.role).to.equal(USER_ROLES.DRIVER));
    });

    it('GET /api/orders?status=in_transit&limit=2 debe filtrar pedidos por estado y aplicar el límite', async () => {
      const customer = await User.create(generateMockUsers(1, { role: USER_ROLES.CUSTOMER })[0]);

      await Order.insertMany([
        {
          customer: customer._id,
          items: [{ name: 'Item 1', quantity: 1, price: 1000 }],
          deliveryAddress: 'Calle 1',
          status: ORDER_STATUS.CREATED,
          priority: DELIVERY_PRIORITY.NORMAL
        },
        {
          customer: customer._id,
          items: [{ name: 'Item 2', quantity: 1, price: 2000 }],
          deliveryAddress: 'Calle 2',
          status: ORDER_STATUS.IN_TRANSIT,
          priority: DELIVERY_PRIORITY.HIGH
        },
        {
          customer: customer._id,
          items: [{ name: 'Item 3', quantity: 1, price: 3000 }],
          deliveryAddress: 'Calle 3',
          status: ORDER_STATUS.IN_TRANSIT,
          priority: DELIVERY_PRIORITY.LOW
        }
      ]);

      const response = await requester.get(`/api/orders?status=${ORDER_STATUS.IN_TRANSIT}&limit=2`);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array').with.lengthOf(2);
      response.body.forEach((o) => expect(o.status).to.equal(ORDER_STATUS.IN_TRANSIT));
    });

    it('GET /api/deliveries?status=delivered&limit=5 debe filtrar entregas por estado', async () => {
      const customer = await User.create(generateMockUsers(1, { role: USER_ROLES.CUSTOMER })[0]);
      const order = await Order.create({
        customer: customer._id,
        items: [{ name: 'Item A', quantity: 1, price: 1000 }],
        deliveryAddress: 'Calle A'
      });

      await Delivery.insertMany([
        { order: order._id, status: DELIVERY_STATUS.PENDING },
        { order: order._id, status: DELIVERY_STATUS.DELIVERED }
      ]);

      const response = await requester.get(`/api/deliveries?status=${DELIVERY_STATUS.DELIVERED}&limit=5`);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array').with.lengthOf(1);
      expect(response.body[0].status).to.equal(DELIVERY_STATUS.DELIVERED);
    });

    it('GET /api/users?page=0 o ?limit=-5 con parámetros de paginación inválidos debe responder 400 VALIDATION_ERROR', async () => {
      const resPage = await requester.get('/api/users?page=0');
      expect(resPage.status).to.equal(400);
      expect(resPage.body.code).to.equal(ERROR_CODES.VALIDATION_ERROR);

      const resLimit = await requester.get('/api/orders?limit=-5');
      expect(resLimit.status).to.equal(400);
      expect(resLimit.body.code).to.equal(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('Preparación para Producción: Health Check Seguro y Validación de Entorno', () => {
    it('GET /api/health debe devolver status, environment, uptime y timestamp SIN exponer secretos', async () => {
      const response = await requester.get('/api/health');

      expect(response.status).to.equal(200);
      expect(response.body).to.include.all.keys('status', 'environment', 'uptime', 'timestamp');
      expect(response.body.status).to.equal('ok');
      expect(response.body.uptime).to.be.a('number');
      expect(response.body).to.not.have.property('secret');
      expect(response.body).to.not.have.property('JWT_SECRET');
      expect(response.body).to.not.have.property('MONGODB_URI');
    });

    it('validateEnvVariables debe fallar al inicio con un mensaje claro si faltan variables críticas', () => {
      expect(() => validateEnvVariables({ PORT: '3000' })).to.throw(
        /\[ERROR DE CONFIGURACIÓN\] Faltan variables de entorno críticas requeridas/
      );
    });
  });

  describe('Criterio sobre Endpoints Internos en Producción (Mocks, LoggerTest y Swagger)', () => {
    it('En NODE_ENV=production debe restringir /api/mocks, /api/loggerTest y /api/docs con 403 FORBIDDEN_OPERATION por defecto', async () => {
      process.env.NODE_ENV = 'production';
      process.env.ENABLE_INTERNAL_ENDPOINTS_IN_PROD = 'false';
      process.env.ENABLE_SWAGGER_IN_PROD = 'false';

      const mocksRes = await requester.get('/api/mocks/users?qty=2');
      expect(mocksRes.status).to.equal(403);
      expect(mocksRes.body.code).to.equal(ERROR_CODES.FORBIDDEN_OPERATION);

      const loggerRes = await requester.get('/api/loggerTest');
      expect(loggerRes.status).to.equal(403);
      expect(loggerRes.body.code).to.equal(ERROR_CODES.FORBIDDEN_OPERATION);

      const swaggerRes = await requester.get('/api/docs.json');
      expect(swaggerRes.status).to.equal(403);
      expect(swaggerRes.body.code).to.equal(ERROR_CODES.FORBIDDEN_OPERATION);

      process.env.NODE_ENV = 'test';
    });

    it('En NODE_ENV=production con ENABLE_SWAGGER_IN_PROD=true debe permitir el acceso a Swagger UI manteniendo bloqueados los mocks', async () => {
      process.env.NODE_ENV = 'production';
      process.env.ENABLE_SWAGGER_IN_PROD = 'true';
      process.env.ENABLE_INTERNAL_ENDPOINTS_IN_PROD = 'false';

      const swaggerRes = await requester.get('/api/docs.json');
      expect(swaggerRes.status).to.equal(200);
      expect(swaggerRes.body.openapi).to.equal('3.0.3');

      const mocksRes = await requester.get('/api/mocks/users?qty=2');
      expect(mocksRes.status).to.equal(403);

      process.env.NODE_ENV = 'test';
      delete process.env.ENABLE_SWAGGER_IN_PROD;
    });
  });
});
