import Order from '../models/order.model.js';

class OrderRepository {
  async findAll(filter = {}) {
    return await Order.find(filter)
      .populate('customer', 'firstName lastName email role')
      .populate('delivery')
      .exec();
  }

  async getAll(filter = {}) {
    return await this.findAll(filter);
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
