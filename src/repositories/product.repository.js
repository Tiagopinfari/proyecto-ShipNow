import Product from '../models/product.model.js';
import { PRODUCT_STATUS } from '../constants/index.js';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../utils/pagination.js';

class ProductRepository {
  async findAll(filter = {}, options = {}) {
    const {
      projection = null,
      sort = { createdAt: -1 },
      limit = DEFAULT_LIMIT,
      skip = 0
    } = options;

    const safeLimit = Math.min(Math.max(1, Number(limit) || DEFAULT_LIMIT), MAX_LIMIT);
    const safeSkip = Math.max(0, Number(skip) || 0);

    return await Product.find(filter, projection)
      .sort(sort)
      .skip(safeSkip)
      .limit(safeLimit)
      .exec();
  }

  async findAvailable(options = {}) {
    const filter = {
      stock: { $gt: 0 },
      status: PRODUCT_STATUS.AVAILABLE
    };
    return await this.findAll(filter, options);
  }

  async findById(id, projection = null) {
    return await Product.findById(id, projection).exec();
  }

  async findByCode(code) {
    return await Product.findOne({ code: code.trim() }).exec();
  }

  async create(productData) {
    return await Product.create(productData);
  }

  async update(id, updateData) {
    return await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).exec();
  }

  async delete(id) {
    return await Product.findByIdAndDelete(id).exec();
  }
}

export default new ProductRepository();
