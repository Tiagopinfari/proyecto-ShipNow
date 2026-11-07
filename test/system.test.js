import { expect } from 'chai';
import supertest from 'supertest';
import app from '../src/app.js';
import { ERROR_CODES } from '../src/utils/errorDictionary.js';

const requester = supertest(app);

describe('Tests Funcionales — Logger, Swagger y Rutas Globales', () => {
  describe('Endpoint de validación del Logger', () => {
    it('GET /api/loggerTest debe responder 200 y confirmar la ejecución de los 6 niveles de Winston', async () => {
      const response = await requester.get('/api/loggerTest');

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('object');
      expect(response.body.status).to.equal('success');
      expect(response.body.levelsTested).to.deep.equal([
        'debug',
        'http',
        'info',
        'warning',
        'error',
        'fatal'
      ]);
    });

    it('GET /loggerTest (alias) debe responder 200 con la misma estructura de validación', async () => {
      const response = await requester.get('/loggerTest');

      expect(response.status).to.equal(200);
      expect(response.body.status).to.equal('success');
      expect(response.body.levelsTested).to.include('fatal');
    });
  });

  describe('Documentación Interactiva con Swagger / OpenAPI', () => {
    it('GET /api/docs/ debe responder 200 y servir la interfaz HTML de Swagger UI', async () => {
      const response = await requester.get('/api/docs/');

      expect(response.status).to.equal(200);
      expect(response.headers['content-type']).to.include('text/html');
      expect(response.text).to.include('swagger-ui');
    });

    it('GET /api/docs.json debe responder 200 y devolver la especificación OpenAPI 3.0.3 completa', async () => {
      const response = await requester.get('/api/docs.json');

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('object');
      expect(response.body.openapi).to.equal('3.0.3');
      expect(response.body.info.title).to.include('ShipNow API');
      expect(response.body.paths).to.include.all.keys(
        '/api/users',
        '/api/orders',
        '/api/deliveries',
        '/api/mocks/users',
        '/api/mocks/mockingUsers',
        '/api/mocks/seed',
        '/api/loggerTest',
        '/loggerTest'
      );
    });
  });

  describe('Manejo de Rutas Inexistentes (404 Not Found)', () => {
    it('GET a una ruta inexistente debe responder 404 con estructura uniforme y código ROUTE_NOT_FOUND', async () => {
      const response = await requester.get('/api/ruta-que-no-existe-12345');

      expect(response.status).to.equal(404);
      expect(response.body).to.be.an('object');
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.ROUTE_NOT_FOUND
      });
      expect(response.body.message).to.include('/api/ruta-que-no-existe-12345');
    });
  });
});
