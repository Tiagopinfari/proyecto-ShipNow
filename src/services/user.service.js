import userRepository from '../repositories/user.repository.js';
import { USER_ROLES } from '../constants/index.js';
import {
  UserNotFoundError,
  ValidationError,
  InvalidRoleError,
  ConflictError,
  ForbiddenError
} from '../utils/errors.js';

class UserService {
  async getUsers() {
    return await userRepository.findAll();
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundError('Usuario no encontrado');
    }
    return user;
  }

  async createUser(userData) {
    const { firstName, lastName, email, password, role } = userData;

    if (!firstName || !lastName || !email || !password) {
      throw new ValidationError('Faltan campos obligatorios para registrar el usuario (firstName, lastName, email, password)');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictError('El email ya se encuentra registrado');
    }

    if (role === USER_ROLES.ADMIN) {
      throw new ForbiddenError('No se puede crear un admin desde este endpoint');
    }

    if (role && !Object.values(USER_ROLES).includes(role)) {
      throw new InvalidRoleError('Rol de usuario inválido');
    }

    const assignedRole = role || USER_ROLES.CUSTOMER;

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

  async updateUser(id, updateData) {
    const updatedUser = await userRepository.update(id, updateData);
    if (!updatedUser) {
      throw new UserNotFoundError('Usuario no encontrado');
    }
    return updatedUser;
  }

  async deleteUser(id) {
    const deletedUser = await userRepository.delete(id);
    if (!deletedUser) {
      throw new UserNotFoundError('Usuario no encontrado');
    }
    return { message: 'Usuario eliminado' };
  }
}

export default new UserService();
