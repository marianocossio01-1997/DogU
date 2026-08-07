import type { Request, Response, NextFunction } from 'express';
import { AppError } from "../utils/AppError.js";
import { verifyToken } from '../config/jwt.js';

export interface AuthMiddleware extends Request{
    user?: any 
}
export const authMiddleware = (req: AuthMiddleware, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
        throw new AppError("Token no proporcionado o no es valido", 401);
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = verifyToken(token!); // Aquí deberías verificar el token y decodificarlo
        req.user = decoded;
        next();

    } catch (error) {       
        throw new AppError("Token no valido", 401);
    }    
}