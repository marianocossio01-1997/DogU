import * as userService from "../services/users.service.js";
import { AppError } from '../utils/AppError.js';
import { createUserSchema } from '../validators/user.validator.js';
export const update = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const data = req.body;
        const file = req.file;
        const user = await userService.update(id, data, file);
        return res.status(200).json(user);
    }
    catch (error) {
        next(error);
    }
};
export const findById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await userService.findById(Number(id));
        return res.status(200).json(user);
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=users.controller.js.map