import userService from '../services/user.service.js';
import { HTTP_STATUS } from '../constants/index.js';

class UserController {
  async getAll(req, res, next) {
    try {
      const users = await userService.getUsers();
      return res.status(HTTP_STATUS.OK).json(users);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      return res.status(HTTP_STATUS.OK).json(user);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const newUser = await userService.createUser(req.body);
      return res.status(HTTP_STATUS.CREATED).json(newUser);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const updatedUser = await userService.updateUser(req.params.id, req.body);
      return res.status(HTTP_STATUS.OK).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await userService.deleteUser(req.params.id);
      return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
