import type { Request, Response, NextFunction } from 'express';
import * as authService from "../services/auth.service.js"; 
import { AppError } from '../utils/AppError.js';
import { createUserSchema } from '../validators/user.validator.js';

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.register(req.body);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }    
}
export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.loginUser(req.body);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }    
        
} 