import { expect } from 'chai';
import supertest from 'supertest';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import app from '../src/app.js';
import User from '../src/models/user.model.js';
import Order from '../src/models/order.model.js';
import Delivery from '../src/models/delivery.model.js';
import { generateMockUser } from '../src/mocks/user.mock.js';
import { USER_ROLES, DOCUMENT_TYPES } from '../src/constants/index.js';
import { ERROR_CODES } from '../src/utils/errorDictionary.js';

const requester = supertest(app);

describe('Tests Funcionales — Módulo Uploads (Documentos y Comprobantes con Multer)', () => {
  let testCustomer;
  let testDriver;
  let testOrder;
  let testDelivery;
  const createdFiles = [];

  const trackFileForCleanup = (relPath) => {
    if (relPath) {
      createdFiles.push(path.resolve(process.cwd(), relPath));
    }
  };

  beforeEach(async () => {
    await Promise.all([
      Delivery.deleteMany({}),
      Order.deleteMany({}),
      User.deleteMany({})
    ]);

    testCustomer = await User.create(generateMockUser({ role: USER_ROLES.CUSTOMER }));
    testDriver = await User.create(generateMockUser({ role: USER_ROLES.DRIVER }));
    testOrder = await Order.create({
      customer: testCustomer._id,
      items: [{ name: 'Producto Con Comprobante', quantity: 1, price: 18000 }],
      deliveryAddress: 'Av. Callao 850, CABA',
      declaredValue: 18000,
      shippingCost: 10,
      total: 18010
    });
    testDelivery = await Delivery.create({
      order: testOrder._id,
      driver: testDriver._id
    });
  });

  afterEach(() => {
    while (createdFiles.length > 0) {
      const filePath = createdFiles.pop();
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });

  after(async () => {
    await Promise.all([
      Delivery.deleteMany({}),
      Order.deleteMany({}),
      User.deleteMany({})
    ]);
  });

  describe('Casos Exitosos de Carga y Registro de Metadatos', () => {
    it('POST /api/users/:id/documents debe subir un PDF válido, guardarlo en disco y registrar solo sus metadatos en el usuario (201)', async () => {
      const fakePdfBuffer = Buffer.from('%PDF-1.4 Documento de identidad de prueba');

      const response = await requester
        .post(`/api/users/${testDriver._id}/documents`)
        .field('documentType', DOCUMENT_TYPES.DRIVER_LICENSE)
        .attach('file', fakePdfBuffer, {
          filename: 'licencia_conducir.pdf',
          contentType: 'application/pdf'
        });

      expect(response.status).to.equal(201);
      expect(response.body).to.be.an('object');
      expect(response.body).to.have.property('message');
      expect(response.body).to.have.property('document');
      expect(response.body).to.have.property('user');

      const docMeta = response.body.document;
      trackFileForCleanup(docMeta.path);

      expect(docMeta).to.include.all.keys(
        'originalName',
        'filename',
        'path',
        'mimetype',
        'size',
        'documentType',
        'uploadedAt'
      );
      expect(docMeta.originalName).to.equal('licencia_conducir.pdf');
      expect(docMeta.mimetype).to.equal('application/pdf');
      expect(docMeta.documentType).to.equal(DOCUMENT_TYPES.DRIVER_LICENSE);
      expect(docMeta.path).to.include('uploads/users/licenses/');
      expect(docMeta).to.not.have.property('buffer');

      // Verificar que el archivo físico exista en el servidor
      const absPath = path.resolve(process.cwd(), docMeta.path);
      expect(fs.existsSync(absPath)).to.be.true;

      // Verificar que la entidad usuario tenga los metadatos asociados
      expect(response.body.user.documents).to.be.an('array').with.lengthOf(1);
      expect(response.body.user.documents[0].filename).to.equal(docMeta.filename);
    });

    it('POST /api/deliveries/:id/proof debe subir un comprobante de imagen (PNG), guardarlo y asociar sus metadatos a la entrega (201)', async () => {
      const fakePngBuffer = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');

      const response = await requester
        .post(`/api/deliveries/${testDelivery._id}/proof`)
        .attach('file', fakePngBuffer, {
          filename: 'comprobante_entrega.png',
          contentType: 'image/png'
        });

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('proof');
      expect(response.body).to.have.property('delivery');

      const proofMeta = response.body.proof;
      trackFileForCleanup(proofMeta.path);

      expect(proofMeta.originalName).to.equal('comprobante_entrega.png');
      expect(proofMeta.mimetype).to.equal('image/png');
      expect(proofMeta.documentType).to.equal(DOCUMENT_TYPES.DELIVERY_PROOF);
      expect(proofMeta.path).to.include('uploads/deliveries/proofs/');

      const absPath = path.resolve(process.cwd(), proofMeta.path);
      expect(fs.existsSync(absPath)).to.be.true;
      expect(response.body.delivery.proof.filename).to.equal(proofMeta.filename);
    });

    it('POST /api/orders/:id/proof debe subir un comprobante asociado a un pedido existente y devolver la entidad actualizada (201)', async () => {
      const fakeJpgBuffer = Buffer.from('ffd8ffe000104a4649460001', 'hex');

      const response = await requester
        .post(`/api/orders/${testOrder._id}/proof`)
        .attach('file', fakeJpgBuffer, {
          filename: 'remito_firmado.jpg',
          contentType: 'image/jpeg'
        });

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('proof');
      expect(response.body).to.have.property('order');

      const proofMeta = response.body.proof;
      trackFileForCleanup(proofMeta.path);

      expect(proofMeta.originalName).to.equal('remito_firmado.jpg');
      expect(proofMeta.mimetype).to.equal('image/jpeg');
      expect(proofMeta.documentType).to.equal(DOCUMENT_TYPES.DELIVERY_PROOF);
      expect(response.body.order.proof.filename).to.equal(proofMeta.filename);
    });
  });

  describe('Casos de Error Esperados en Carga de Archivos', () => {
    it('POST /api/users/:id/documents cuando falta el archivo debe responder 400 y código FILE_REQUIRED', async () => {
      const response = await requester
        .post(`/api/users/${testCustomer._id}/documents`)
        .field('documentType', DOCUMENT_TYPES.USER_DOCUMENT);

      expect(response.status).to.equal(400);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.FILE_REQUIRED
      });
    });

    it('POST /api/users/:id/documents con un tipo de archivo no permitido (.exe / text/plain) debe responder 400 y código INVALID_FILE_TYPE', async () => {
      const invalidBuffer = Buffer.from('contenido no permitido');

      const response = await requester
        .post(`/api/users/${testCustomer._id}/documents`)
        .field('documentType', DOCUMENT_TYPES.USER_DOCUMENT)
        .attach('file', invalidBuffer, {
          filename: 'script_malicioso.txt',
          contentType: 'text/plain'
        });

      expect(response.status).to.equal(400);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.INVALID_FILE_TYPE
      });
    });

    it('POST /api/users/:id/documents con un documentType inválido debe responder 400 y código INVALID_DOCUMENT_TYPE', async () => {
      const validPdfBuffer = Buffer.from('%PDF-1.4 prueba');

      const response = await requester
        .post(`/api/users/${testCustomer._id}/documents`)
        .field('documentType', 'tipo_documento_inexistente')
        .attach('file', validPdfBuffer, {
          filename: 'dni.pdf',
          contentType: 'application/pdf'
        });

      expect(response.status).to.equal(400);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.INVALID_DOCUMENT_TYPE
      });
    });

    it('POST /api/users/:id/documents superando el tamaño máximo (5 MB) debe responder 400 y código FILE_TOO_LARGE', async () => {
      const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024, 'a');

      const response = await requester
        .post(`/api/users/${testCustomer._id}/documents`)
        .field('documentType', DOCUMENT_TYPES.USER_DOCUMENT)
        .attach('file', oversizedBuffer, {
          filename: 'archivo_pesado.pdf',
          contentType: 'application/pdf'
        });

      expect(response.status).to.equal(400);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.FILE_TOO_LARGE
      });
    });

    it('POST /api/users/:id/documents cuando el usuario no existe debe responder 404 y código USER_NOT_FOUND sin guardar archivo huérfano', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const validPdfBuffer = Buffer.from('%PDF-1.4 prueba');

      const response = await requester
        .post(`/api/users/${fakeUserId}/documents`)
        .field('documentType', DOCUMENT_TYPES.USER_DOCUMENT)
        .attach('file', validPdfBuffer, {
          filename: 'dni.pdf',
          contentType: 'application/pdf'
        });

      expect(response.status).to.equal(404);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.USER_NOT_FOUND
      });
    });

    it('POST /api/deliveries/:id/proof cuando la entrega no existe debe responder 404 y código DELIVERY_NOT_FOUND', async () => {
      const fakeDeliveryId = new mongoose.Types.ObjectId();
      const validPngBuffer = Buffer.from('89504e470d0a1a0a', 'hex');

      const response = await requester
        .post(`/api/deliveries/${fakeDeliveryId}/proof`)
        .attach('file', validPngBuffer, {
          filename: 'comprobante.png',
          contentType: 'image/png'
        });

      expect(response.status).to.equal(404);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.DELIVERY_NOT_FOUND
      });
    });

    it('POST /api/orders/:id/proof cuando el pedido no existe debe responder 404 y código ORDER_NOT_FOUND', async () => {
      const fakeOrderId = new mongoose.Types.ObjectId();
      const validPngBuffer = Buffer.from('89504e470d0a1a0a', 'hex');

      const response = await requester
        .post(`/api/orders/${fakeOrderId}/proof`)
        .attach('file', validPngBuffer, {
          filename: 'comprobante_pedido.png',
          contentType: 'image/png'
        });

      expect(response.status).to.equal(404);
      expect(response.body).to.include({
        status: 'error',
        code: ERROR_CODES.ORDER_NOT_FOUND
      });
    });
  });
});
