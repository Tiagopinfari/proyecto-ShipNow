import productRepository from '../repositories/product.repository.js';
import { PRODUCT_STATUS } from '../constants/index.js';
import config from '../config/env.config.js';

const emailProvider = {
  send: async (message) => {
    console.log('[EMAIL] ' + message);
  }
};

class ProductService {
  /**
   * Recupera la lista de productos según la regla de negocio.
   * Si all es true, retorna todos los productos del catálogo.
   * Si all es false o no viene especificado, retorna solo los disponibles para la venta.
   */
  async getProducts({ all = false } = {}) {
    if (all === true || all === 'true') {
      return await productRepository.findAll();
    }
    return await productRepository.findAvailable();
  }

  /**
   * Obtiene un producto por su ID.
   * Valida existencia y reglas de negocio asociadas.
   */
  async getProductById(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      const error = new Error('Producto no encontrado');
      error.statusCode = 404;
      throw error;
    }
    return product;
  }

  /**
   * Crea un nuevo producto validando campos obligatorios,
   * unicidad de código, consistencia de stock y estado inicial.
   */
  async createProduct(productData) {
    const { title, code, price, stock = 0, description, category } = productData;

    if (!title || !code || price === undefined || price === null) {
      const error = new Error('Faltan campos obligatorios');
      error.statusCode = 400;
      throw error;
    }

    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      const error = new Error('Precio inválido');
      error.statusCode = 400;
      throw error;
    }

    const numericStock = Number(stock) || 0;
    if (numericStock < 0) {
      const error = new Error('El stock no puede ser negativo');
      error.statusCode = 400;
      throw error;
    }

    const existingProduct = await productRepository.findByCode(code);
    if (existingProduct) {
      const error = new Error('Ya existe un producto con el código especificado');
      error.statusCode = 400;
      error.customResponse = { status: 'error', data: null };
      throw error;
    }

    // Regla de negocio: determinación automática del estado según el stock inicial
    const initialStatus = numericStock > 0 ? PRODUCT_STATUS.AVAILABLE : PRODUCT_STATUS.OUT_OF_STOCK;

    const newProduct = await productRepository.create({
      title: title.trim(),
      code: code.trim(),
      price: numericPrice,
      stock: numericStock,
      description: description || '',
      category: category || 'general',
      status: initialStatus
    });

    // Disparar notificación por email (simulada)
    await emailProvider.send(`Producto creado: ${newProduct.title}`);

    return newProduct;
  }

  /**
   * Actualiza un producto normalizando estados y recalculando disponibilidad
   */
  async updateProduct(id, updateData) {
    const payload = { ...updateData };

    // Normalización de estados ingresados en distintos formatos
    if (typeof payload.status === 'string') {
      const normalizedStatus = payload.status.toLowerCase();
      if (normalizedStatus === PRODUCT_STATUS.OUT_OF_STOCK) {
        payload.status = PRODUCT_STATUS.OUT_OF_STOCK;
      } else if (normalizedStatus === PRODUCT_STATUS.AVAILABLE) {
        payload.status = PRODUCT_STATUS.AVAILABLE;
      }
    }

    // Regla de negocio: si se actualiza el stock, sincronizar el estado
    if (payload.stock !== undefined) {
      const numericStock = Number(payload.stock);
      if (numericStock < 0) {
        const error = new Error('El stock no puede ser negativo');
        error.statusCode = 400;
        throw error;
      }
      payload.stock = numericStock;
      payload.status = numericStock > 0 ? PRODUCT_STATUS.AVAILABLE : PRODUCT_STATUS.OUT_OF_STOCK;
    }

    const updatedProduct = await productRepository.update(id, payload);
    if (!updatedProduct) {
      const error = new Error('Producto no encontrado');
      error.statusCode = 404;
      throw error;
    }

    return updatedProduct;
  }

  /**
   * Elimina un producto por ID
   */
  async deleteProduct(id) {
    const deletedProduct = await productRepository.delete(id);
    if (!deletedProduct) {
      const error = new Error('Producto no encontrado');
      error.statusCode = 404;
      throw error;
    }
    return { message: 'Producto eliminado' };
  }

  /**
   * Lógica de negocio para cotizar el costo de envío de un producto
   */
  async calculateShippingCost(id) {
    const product = await this.getProductById(id);

    if (!config.SHIPPING_API_KEY) {
      const error = new Error('Falta API key');
      error.statusCode = 500;
      throw error;
    }

    // Regla de cotización de envío
    const shippingCost = config.isProduction ? 50 + product.price * 0.01 : 10;

    return {
      product: product._id,
      declaredValue: product.price,
      shippingCost
    };
  }
}

export default new ProductService();
