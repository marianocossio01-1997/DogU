import * as authService from "../services/auth.service.js";
import { AppError } from '../utils/AppError.js';
import { createUserSchema } from '../validators/user.validator.js';
export const register = async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
export const login = async (req, res, next) => {
    try {
        const result = await authService.loginUser(req.body);
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=auth.controller.js.map