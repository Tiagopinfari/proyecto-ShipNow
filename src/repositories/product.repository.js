import Product from '../models/product.model.js';
import { PRODUCT_STATUS } from '../constants/index.js';

class ProductRepository {
  /**
   * Obtiene todos los productos con opciones de filtro, proyección y ordenamiento.
   * Encapsula la consulta a la base de datos evitando ser un mero pasamanos.
   */
  async findAll(filter = {}, options = {}) {
    const { projection = null, sort = { createdAt: -1 }, limit = null } = options;
    let query = Product.find(filter, projection).sort(sort);
    if (limit && Number.isInteger(limit) && limit > 0) {
      query = query.limit(limit);
    }
    return await query.exec();
  }

  /**
   * Obtiene productos disponibles para venta (con stock mayor a cero y estado available)
   */
  async findAvailable(options = {}) {
    const filter = {
      stock: { $gt: 0 },
      status: PRODUCT_STATUS.AVAILABLE
    };
    return await this.findAll(filter, options);
  }

  /**
   * Busca un producto por su ObjectId de MongoDB
   */
  async findById(id, projection = null) {
    return await Product.findById(id, projection).exec();
  }

  /**
   * Busca un producto por su código único de producto
   */
  async findByCode(code) {
    return await Product.findOne({ code: code.trim() }).exec();
  }

  /**
   * Crea y persiste un nuevo producto en la base de datos
   */
  async create(productData) {
    return await Product.create(productData);
  }

  /**
   * Actualiza un producto existente por ID retornando el documento actualizado
   */
  async update(id, updateData) {
    return await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).exec();
  }

  /**
   * Elimina un producto por ID
   */
  async delete(id) {
    return await Product.findByIdAndDelete(id).exec();
  }
}

export default new ProductRepository();
