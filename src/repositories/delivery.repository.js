import Delivery from '../models/delivery.model.js';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../utils/pagination.js';

class DeliveryRepository {
  async findAll(filter = {}, options = {}) {
    const {
      sort = { createdAt: -1 },
      limit = DEFAULT_LIMIT,
      skip = 0
    } = options;

    const safeLimit = Math.min(Math.max(1, Number(limit) || DEFAULT_LIMIT), MAX_LIMIT);
    const safeSkip = Math.max(0, Number(skip) || 0);

    return await Delivery.find(filter)
      .populate('order')
      .populate('driver', 'firstName lastName email role')
      .sort(sort)
      .skip(safeSkip)
      .limit(safeLimit)
      .exec();
  }

  async getAll(filter = {}, options = {}) {
    return await this.findAll(filter, options);
  }

  async count(filter = {}) {
    return await Delivery.countDocuments(filter);
  }

  async findById(id) {
    return await Delivery.findById(id)
      .populate('order')
      .populate('driver', 'firstName lastName email role')
      .exec();
  }

  async getById(id) {
    return await this.findById(id);
  }

  async create(deliveryData) {
    return await Delivery.create(deliveryData);
  }

  async insertMany(deliveries) {
    return await Delivery.insertMany(deliveries);
  }

  async update(id, updateData) {
    return await Delivery.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async delete(id) {
    return await Delivery.findByIdAndDelete(id).exec();
  }
}

export const deliveryRepository = new DeliveryRepository();
export default deliveryRepository;
