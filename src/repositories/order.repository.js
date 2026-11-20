import Order from '../models/order.model.js';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../utils/pagination.js';

class OrderRepository {
  async findAll(filter = {}, options = {}) {
    const {
      sort = { createdAt: -1 },
      limit = DEFAULT_LIMIT,
      skip = 0
    } = options;

    const safeLimit = Math.min(Math.max(1, Number(limit) || DEFAULT_LIMIT), MAX_LIMIT);
    const safeSkip = Math.max(0, Number(skip) || 0);

    return await Order.find(filter)
      .populate('customer', 'firstName lastName email role')
      .populate('delivery')
      .sort(sort)
      .skip(safeSkip)
      .limit(safeLimit)
      .exec();
  }

  async getAll(filter = {}, options = {}) {
    return await this.findAll(filter, options);
  }

  async count(filter = {}) {
    return await Order.countDocuments(filter);
  }

  async findById(id) {
    return await Order.findById(id)
      .populate('customer', 'firstName lastName email role')
      .populate('delivery')
      .exec();
  }

  async getById(id) {
    return await this.findById(id);
  }

  async create(orderData) {
    return await Order.create(orderData);
  }

  async insertMany(orders) {
    return await Order.insertMany(orders);
  }

  async update(id, updateData) {
    return await Order.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async delete(id) {
    return await Order.findByIdAndDelete(id).exec();
  }
}

export const orderRepository = new OrderRepository();
export default orderRepository;
