import userRepository from '../repositories/user.repository.js';
import { USER_ROLES, DOCUMENT_TYPES } from '../constants/index.js';
import logger from '../config/logger.js';
import { persistUploadedFile } from '../config/multer.config.js';
import {
  UserNotFoundError,
  ValidationError,
  InvalidRoleError,
  ConflictError,
  ForbiddenError,
  FileRequiredError,
  InvalidDocumentTypeError
} from '../utils/errors.js';

const VALID_USER_DOCUMENT_TYPES = Object.values(DOCUMENT_TYPES);

class UserService {
  async getUsers() {
    return await userRepository.findAll();
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      logger.warning(`Consulta de usuario inexistente: ID ${id}`);
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

    logger.info(`Usuario creado exitosamente con ID: ${newUser._id} (email: ${newUser.email})`);
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

  async uploadDocument(id, { file, documentType }) {
    if (!file) {
      logger.warning(`Intento de subir documento a usuario ID ${id} sin archivo adjunto`);
      throw new FileRequiredError('El archivo es obligatorio para registrar un documento de usuario');
    }

    const activeDocType = documentType ? String(documentType).trim() : DOCUMENT_TYPES.USER_DOCUMENT;
    if (!VALID_USER_DOCUMENT_TYPES.includes(activeDocType)) {
      logger.warning(`Tipo de documento inválido enviado para usuario ID ${id}: "${documentType}"`);
      throw new InvalidDocumentTypeError(
        `Tipo de documento inválido ("${documentType}"). Valores permitidos: ${VALID_USER_DOCUMENT_TYPES.join(', ')}`
      );
    }

    const user = await userRepository.findById(id);
    if (!user) {
      logger.warning(`Fallo al subir documento: usuario inexistente ID ${id}`);
      throw new UserNotFoundError('Usuario no encontrado');
    }

    const metadata = persistUploadedFile({
      file,
      documentType: activeDocType,
      entityPrefix: `user-${id}`
    });

    const currentDocuments = Array.isArray(user.documents) ? [...user.documents] : [];
    currentDocuments.push(metadata);

    const updatedUser = await userRepository.update(id, { documents: currentDocuments });
    logger.info(
      `Documento "${metadata.originalName}" (tipo: ${activeDocType}) cargado y asociado exitosamente al usuario ID ${id}`
    );

    return {
      message: 'Documento de usuario cargado y registrado exitosamente',
      document: metadata,
      user: updatedUser
    };
  }
}

export default new UserService();
