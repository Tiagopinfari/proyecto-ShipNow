import productService from '../services/product.service.js';
import { HTTP_STATUS } from '../constants/index.js';

class ProductController {
  async getAll(req, res, next) {
    try {
      const products = await productService.getProducts({ all: req.query.all });
      return res.status(HTTP_STATUS.OK).json(products);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      return res.status(HTTP_STATUS.OK).json(product);
    } catch (error) {
      next(error);
    }
  }

  async getShippingCost(req, res, next) {
    try {
      const quote = await productService.calculateShippingCost(req.params.id);
      return res.status(HTTP_STATUS.OK).json(quote);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const newProduct = await productService.createProduct(req.body);
      return res.status(HTTP_STATUS.CREATED).json(newProduct);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const updatedProduct = await productService.updateProduct(req.params.id, req.body);
      return res.status(HTTP_STATUS.OK).json(updatedProduct);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await productService.deleteProduct(req.params.id);
      return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();
