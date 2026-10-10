import Delivery from '../models/delivery.model.js';

class DeliveryRepository {
  async findAll(filter = {}) {
    return await Delivery.find(filter)
      .populate('order')
      .populate('driver', 'firstName lastName email role')
      .exec();
  }

  async getAll(filter = {}) {
    return await this.findAll(filter);
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
