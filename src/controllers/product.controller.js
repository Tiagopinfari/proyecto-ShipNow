import productService from '../services/product.service.js';
import { HTTP_STATUS } from '../constants/index.js';

class ProductController {
  async getAll(req, res) {
    try {
      const products = await productService.getProducts({ all: req.query.all });
      return res.status(HTTP_STATUS.OK).json(products);
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error del servidor');
    }
  }

  async getById(req, res) {
    try {
      const product = await productService.getProductById(req.params.id);
      return res.status(HTTP_STATUS.OK).json(product);
    } catch (error) {
      if (error.statusCode === HTTP_STATUS.NOT_FOUND) {
        return res.status(HTTP_STATUS.NOT_FOUND).send(error.message);
      }
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error del servidor');
    }
  }

  async getShippingCost(req, res) {
    try {
      const quote = await productService.calculateShippingCost(req.params.id);
      return res.status(HTTP_STATUS.OK).json(quote);
    } catch (error) {
      if (error.statusCode === HTTP_STATUS.NOT_FOUND) {
        return res.status(HTTP_STATUS.NOT_FOUND).send(error.message);
      }
      if (error.statusCode) {
        return res.status(error.statusCode).send(error.message);
      }
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error del servidor');
    }
  }

  async create(req, res) {
    try {
      const newProduct = await productService.createProduct(req.body);
      return res.status(HTTP_STATUS.CREATED).json(newProduct);
    } catch (error) {
      if (error.customResponse) {
        return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json(error.customResponse);
      }
      if (error.statusCode === HTTP_STATUS.BAD_REQUEST) {
        return res.status(HTTP_STATUS.BAD_REQUEST).send(error.message);
      }
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error del servidor');
    }
  }

  async update(req, res) {
    try {
      const updatedProduct = await productService.updateProduct(req.params.id, req.body);
      return res.status(HTTP_STATUS.OK).json(updatedProduct);
    } catch (error) {
      if (error.statusCode === HTTP_STATUS.NOT_FOUND) {
        return res.status(HTTP_STATUS.NOT_FOUND).send(error.message);
      }
      if (error.statusCode === HTTP_STATUS.BAD_REQUEST) {
        return res.status(HTTP_STATUS.BAD_REQUEST).send(error.message);
      }
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error del servidor');
    }
  }

  async delete(req, res) {
    try {
      const result = await productService.deleteProduct(req.params.id);
      return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      if (error.statusCode === HTTP_STATUS.NOT_FOUND) {
        return res.status(HTTP_STATUS.NOT_FOUND).send(error.message);
      }
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error del servidor');
    }
  }
}

export default new ProductController();
