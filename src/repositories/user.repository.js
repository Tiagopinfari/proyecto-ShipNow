import User from '../models/user.model.js';

class UserRepository {
  /**
   * Obtiene todos los usuarios encapsulando opciones de proyección y orden
   */
  async findAll(filter = {}, options = {}) {
    const { projection = null, sort = { createdAt: -1 } } = options;
    return await User.find(filter, projection).sort(sort).exec();
  }

  /**
   * Busca un usuario por su ObjectId
   */
  async findById(id, projection = null) {
    return await User.findById(id, projection).exec();
  }

  /**
   * Busca un usuario por su email
   */
  async findByEmail(email) {
    return await User.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  /**
   * Crea y almacena un nuevo usuario
   */
  async create(userData) {
    return await User.create(userData);
  }

  /**
   * Actualiza los datos de un usuario por su ID
   */
  async update(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).exec();
  }

  /**
   * Elimina un usuario por su ID
   */
  async delete(id) {
    return await User.findByIdAndDelete(id).exec();
  }
}

export default new UserRepository();
