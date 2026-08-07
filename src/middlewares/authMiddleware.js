import { AppError } from "../utils/AppError.js";
import { verifyToken } from '../config/jwt.js';
export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
        throw new AppError("Token no proporcionado o no es valido", 401);
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = verifyToken(token); // Aquí deberías verificar el token y decodificarlo
        req.user = decoded;
        next();
    }
    catch (error) {
        throw new AppError("Token no valido", 401);
    }
};
//# sourceMappingURL=authMiddleware.js.map