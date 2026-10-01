import userRepository from '../repositories/user.repository.js';
import { USER_ROLES } from '../constants/index.js';

class UserService {
  /**
   * Obtiene todos los usuarios
   */
  async getUsers() {
    return await userRepository.findAll();
  }

  /**
   * Obtiene un usuario por ID validando su existencia
   */
  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  /**
   * Crea un nuevo usuario aplicando reglas de negocio:
   * validación de campos obligatorios, unicidad de correo y restricción de creación de admins
   */
  async createUser(userData) {
    const { firstName, lastName, email, password, role } = userData;

    if (!firstName || !lastName || !email || !password) {
      const error = new Error('Faltan campos obligatorios');
      error.statusCode = 400;
      throw error;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      const error = new Error('El email ya se encuentra registrado');
      error.statusCode = 400;
      error.customResponse = { status: 'error', data: null };
      throw error;
    }

    // Regla de negocio: no se permite crear roles ADMIN desde este endpoint
    if (role === USER_ROLES.ADMIN) {
      const error = new Error('No se puede crear un admin desde este endpoint');
      error.statusCode = 403;
      throw error;
    }

    const assignedRole = role || USER_ROLES.USER;

    const newUser = await userRepository.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password,
      role: assignedRole,
      documents: userData.documents || []
    });

    return newUser;
  }

  /**
   * Actualiza los datos de un usuario
   */
  async updateUser(id, updateData) {
    const updatedUser = await userRepository.update(id, updateData);
    if (!updatedUser) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }
    return updatedUser;
  }

  /**
   * Elimina un usuario por ID
   */
  async deleteUser(id) {
    const deletedUser = await userRepository.delete(id);
    if (!deletedUser) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }
    return { message: 'Usuario eliminado' };
  }
}

export default new UserService();
