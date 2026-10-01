import userService from '../services/user.service.js';
import { HTTP_STATUS } from '../constants/index.js';

class UserController {
  async getAll(req, res) {
    try {
      const users = await userService.getUsers();
      return res.status(HTTP_STATUS.OK).json(users);
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error del servidor');
    }
  }

  async getById(req, res) {
    try {
      const user = await userService.getUserById(req.params.id);
      return res.status(HTTP_STATUS.OK).json(user);
    } catch (error) {
      if (error.statusCode === HTTP_STATUS.NOT_FOUND) {
        return res.status(HTTP_STATUS.NOT_FOUND).send(error.message);
      }
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error del servidor');
    }
  }

  async create(req, res) {
    try {
      const newUser = await userService.createUser(req.body);
      return res.status(HTTP_STATUS.CREATED).json(newUser);
    } catch (error) {
      if (error.customResponse) {
        return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json(error.customResponse);
      }
      if (error.statusCode === HTTP_STATUS.BAD_REQUEST) {
        return res.status(HTTP_STATUS.BAD_REQUEST).send(error.message);
      }
      if (error.statusCode === HTTP_STATUS.FORBIDDEN) {
        return res.status(HTTP_STATUS.FORBIDDEN).send(error.message);
      }
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error del servidor');
    }
  }

  async update(req, res) {
    try {
      const updatedUser = await userService.updateUser(req.params.id, req.body);
      return res.status(HTTP_STATUS.OK).json(updatedUser);
    } catch (error) {
      if (error.statusCode === HTTP_STATUS.NOT_FOUND) {
        return res.status(HTTP_STATUS.NOT_FOUND).send(error.message);
      }
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error del servidor');
    }
  }

  async delete(req, res) {
    try {
      const result = await userService.deleteUser(req.params.id);
      return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      if (error.statusCode === HTTP_STATUS.NOT_FOUND) {
        return res.status(HTTP_STATUS.NOT_FOUND).send(error.message);
      }
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error del servidor');
    }
  }
}

export default new UserController();
