import { expect } from 'chai';
import supertest from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/user.model.js';
import { generateMockUser } from '../src/mocks/user.mock.js';
import { USER_ROLES } from '../src/constants/index.js';
import { ERROR_CODES } from '../src/utils/errorDictionary.js';

const requester = supertest(app);

describe('Tests Funcionales — Módulo Users (/api/users)', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  after(async () => {
    await User.deleteMany({});
  });

  describe('Casos Exitosos', () => {
    it('GET /api/users debe devolver status 200 y un listado de usuarios con estructura válida', async () => {
      const mockA = generateMockUser({ role: USER_ROLES.CUSTOMER });
      const mockB = generateMockUser({ role: USER_ROLES.DRIVER });
      await User.insertMany([mockA, mockB]);

      const response = await requester.get('/api/users');

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body).to.have.lengthOf(2);
      expect(response.body[0]).to.include.all.keys('_id', 'firstName', 'lastName', 'email', 'role');
    });

    it('POST /api/users debe crear un usuario válido con status 201 y devolver sus propiedades importantes', async () => {
      const userPayload = generateMockUser({ role: USER_ROLES.CUSTOMER });

      const response = await requester.post('/api/users').send(userPayload);

      expect(response.status).to.equal(201);
      expect(response.body).to.be.an('object');
      expect(response.body).to.have.property('_id');
      expect(response.body.firstName).to.equal(userPayload.firstName);
      expect(response.body.lastName).to.equal(userPayload.lastName);
      expect(response.body.email).to.equal(userPayload.email.toLowerCase());
      expect(response.body.role).to.equal(USER_ROLES.CUSTOMER);
    });

    it('GET /api/users/:id debe devolver status 200 y el usuario solicitado por ID', async () => {
      const created = await User.create(generateMockUser({ role: USER_ROLES.DRIVER }));

      const response = await requester.get(`/api/users/${created._id}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('object');
      expect(response.body._id).to.equal(created._id.toString());
      expect(response.body.email).to.equal(created.email);
      expect(response.body.role).to.equal(USER_ROLES.DRIVER);
    });

    it('PUT /api/users/:id debe actualizar los datos de un usuario existente y devolver status 200', async () => {
      const created = await User.create(generateMockUser({ role: USER_ROLES.CUSTOMER }));

      const response = await requester
        .put(`/api/users/${created._id}`)
        .send({ firstName: 'NombreActualizado', role: USER_ROLES.DRIVER });

      expect(response.status).to.equal(200);
      expect(response.body.firstName).to.equal('NombreActualizado');
      expect(response.body.role).to.equal(USER_ROLES.DRIVER);
    });

    it('DELETE /api/users/:id debe eliminar el usuario y devolver status 200 con mensaje de confirmación', async () => {
      const created = await User.create(generateMockUser({ role: USER_ROLES.CUSTOMER }));

      const response = await requester.delete(`/api/users/${created._id}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('message', 'Usuario eliminado');
    });
  });

  describe('Casos de Error Esperados', () => {
    it('POST /api/users con datos incompletos debe responder 400 y código VALIDATION_ERROR', async () => {
      const response = await requester.post('/api/users').send({ firstName: 'SoloNombre' });

      expect(response.status).to.equal(400);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.VALIDATION_ERROR
      });
      expect(response.body.message).to.be.a('string').and.not.be.empty;
    });

    it('POST /api/users con rol inválido debe responder 400 y código INVALID_USER_ROLE', async () => {
      const invalidUser = {
        ...generateMockUser(),
        role: 'super_hacker_role'
      };

      const response = await requester.post('/api/users').send(invalidUser);

      expect(response.status).to.equal(400);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.INVALID_USER_ROLE
      });
    });

    it('POST /api/users intentando crear rol admin debe responder 403 y código FORBIDDEN_OPERATION', async () => {
      const adminUser = {
        ...generateMockUser(),
        role: USER_ROLES.ADMIN
      };

      const response = await requester.post('/api/users').send(adminUser);

      expect(response.status).to.equal(403);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.FORBIDDEN_OPERATION
      });
    });

    it('POST /api/users con email duplicado debe responder 409 y código CONFLICT_ERROR', async () => {
      const mockUser = generateMockUser();
      await User.create(mockUser);

      const response = await requester.post('/api/users').send(mockUser);

      expect(response.status).to.equal(409);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.CONFLICT_ERROR
      });
    });

    it('GET /api/users/:id con ObjectId inexistente debe responder 404 y código USER_NOT_FOUND', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await requester.get(`/api/users/${fakeId}`);

      expect(response.status).to.equal(404);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.USER_NOT_FOUND
      });
    });

    it('GET /api/users/:id con formato de ID inválido debe responder 400 y código VALIDATION_ERROR', async () => {
      const response = await requester.get('/api/users/id-invalido-123');

      expect(response.status).to.equal(400);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.VALIDATION_ERROR
      });
    });
  });
});
