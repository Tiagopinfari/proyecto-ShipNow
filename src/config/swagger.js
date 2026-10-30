import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './env.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsPattern = path.join(__dirname, '../docs/**/*.yaml').replace(/\\/g, '/');

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'ShipNow API — Sistema de Gestión Logística',
    version: '1.0.0',
    description: `API RESTful profesional para la gestión integral de logística, usuarios, productos, pedidos, entregas, generación de datos de prueba (Mocks con Faker) y monitoreo de logs con Winston.

### Propósito de la API
Centralizar las operaciones de **ShipNow** bajo una arquitectura en 3 capas (**Controller — Service — Repository**), garantizando validación estricta de datos, manejo uniforme de errores de dominio y trazabilidad completa de eventos.`,
    contact: {
      name: 'Tiago Pinfari — Backend 3 (Coderhouse)'
    }
  },
  servers: [
    {
      url: `http://localhost:${config.PORT}`,
      description: `Servidor Local (${config.NODE_ENV})`
    }
  ],
  tags: [
    {
      name: 'Users',
      description: 'Gestión de usuarios del sistema (clientes, repartidores, tiendas y administradores).'
    },
    {
      name: 'Orders',
      description: 'Administración de pedidos, cálculo automático de costos de envío y seguimiento de estados.'
    },
    {
      name: 'Deliveries',
      description: 'Gestión de entregas logísticas vinculadas a pedidos y asignación de repartidores.'
    },
    {
      name: 'Products',
      description: 'Catálogo de productos disponibles, control de stock y cotización de envío.'
    },
    {
      name: 'Mocks',
      description: 'Generación de datos simulados en memoria con Faker e inserción controlada (seed) en MongoDB.'
    },
    {
      name: 'Logger',
      description: 'Herramienta interna de validación y monitoreo de niveles de logging (no representa una funcionalidad de negocio).'
    }
  ]
};

const options = {
  definition: swaggerDefinition,
  apis: [docsPattern]
};

export const swaggerSpec = swaggerJSDoc(options);

export const swaggerUiOptions = {
  explorer: true,
  customSiteTitle: 'ShipNow API — Documentación Swagger'
};

export default swaggerSpec;
