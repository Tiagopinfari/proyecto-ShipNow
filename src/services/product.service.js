import productRepository from '../repositories/product.repository.js';
import { PRODUCT_STATUS } from '../constants/index.js';
import config from '../config/env.config.js';
import {
  ProductNotFoundError,
  ValidationError,
  ConflictError,
  DatabaseOperationError
} from '../utils/errors.js';
import { createError } from '../utils/apiResponse.js';
import { ERROR_CODES } from '../utils/errorDictionary.js';

const emailProvider = {
  send: async (message) => {
    console.log('[EMAIL] ' + message);
  }
};

class ProductService {
  async getProducts({ all = false } = {}) {
    if (all === true || all === 'true') {
      return await productRepository.findAll();
    }
    return await productRepository.findAvailable();
  }

  async getProductById(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new ProductNotFoundError('Producto no encontrado');
    }
    return product;
  }

  async createProduct(productData) {
    const { title, code, price, stock = 0, description, category } = productData;

    if (!title || !code || price === undefined || price === null) {
      throw new ValidationError('Faltan campos obligatorios para crear el producto (title, code, price)');
    }

    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      throw new ValidationError('Precio inválido: no puede ser negativo ni contener caracteres');
    }

    const numericStock = Number(stock) || 0;
    if (numericStock < 0) {
      throw new ValidationError('El stock no puede ser negativo');
    }

    const existingProduct = await productRepository.findByCode(code);
    if (existingProduct) {
      throw new ConflictError('Ya existe un producto con el código especificado');
    }

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

    await emailProvider.send(`Producto creado: ${newProduct.title}`);

    return newProduct;
  }

  async updateProduct(id, updateData) {
    const payload = { ...updateData };

    if (typeof payload.status === 'string') {
      const normalizedStatus = payload.status.toLowerCase();
      if (normalizedStatus === PRODUCT_STATUS.OUT_OF_STOCK) {
        payload.status = PRODUCT_STATUS.OUT_OF_STOCK;
      } else if (normalizedStatus === PRODUCT_STATUS.AVAILABLE) {
        payload.status = PRODUCT_STATUS.AVAILABLE;
      }
    }

    if (payload.stock !== undefined) {
      const numericStock = Number(payload.stock);
      if (numericStock < 0) {
        throw new ValidationError('El stock no puede ser negativo');
      }
      payload.stock = numericStock;
      payload.status = numericStock > 0 ? PRODUCT_STATUS.AVAILABLE : PRODUCT_STATUS.OUT_OF_STOCK;
    }

    const updatedProduct = await productRepository.update(id, payload);
    if (!updatedProduct) {
      throw new ProductNotFoundError('Producto no encontrado');
    }

    return updatedProduct;
  }

  async deleteProduct(id) {
    const deletedProduct = await productRepository.delete(id);
    if (!deletedProduct) {
      throw new ProductNotFoundError('Producto no encontrado');
    }
    return { message: 'Producto eliminado' };
  }

  async calculateShippingCost(id) {
    const product = await this.getProductById(id);

    if (!config.SHIPPING_API_KEY) {
      throw createError(ERROR_CODES.INTERNAL_SERVER_ERROR, 'Falta API key de envíos');
    }

    const shippingCost = config.isProduction ? 50 + product.price * 0.01 : 10;

    return {
      product: product._id,
      declaredValue: product.price,
      shippingCost
    };
  }
}

export default new ProductService();
