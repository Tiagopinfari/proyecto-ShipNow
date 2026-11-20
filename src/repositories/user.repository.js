import User from '../models/user.model.js';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../utils/pagination.js';

class UserRepository {
  async findAll(filter = {}, options = {}) {
    const {
      projection = null,
      sort = { createdAt: -1 },
      limit = DEFAULT_LIMIT,
      skip = 0
    } = options;

    const safeLimit = Math.min(Math.max(1, Number(limit) || DEFAULT_LIMIT), MAX_LIMIT);
    const safeSkip = Math.max(0, Number(skip) || 0);

    return await User.find(filter, projection)
      .sort(sort)
      .skip(safeSkip)
      .limit(safeLimit)
      .exec();
  }

  async getAll(filter = {}, options = {}) {
    return await this.findAll(filter, options);
  }

  async count(filter = {}) {
    return await User.countDocuments(filter);
  }

  async findById(id, projection = null) {
    return await User.findById(id, projection).exec();
  }

  async getById(id) {
    return await this.findById(id);
  }

  async findByEmail(email) {
    return await User.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async getByEmail(email) {
    return await this.findByEmail(email);
  }

  async create(userData) {
    return await User.create(userData);
  }

  async insertMany(users) {
    return await User.insertMany(users);
  }

  async update(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).exec();
  }

  async delete(id) {
    return await User.findByIdAndDelete(id).exec();
  }
}

export const userRepository = new UserRepository();
export default userRepository;
