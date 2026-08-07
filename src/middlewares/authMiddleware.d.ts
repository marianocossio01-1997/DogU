import type { Request, Response, NextFunction } from 'express';
export interface AuthMiddleware extends Request {
    user?: any;
}
export declare const authMiddleware: (req: AuthMiddleware, res: Response, next: NextFunction) => void;
//# sourceMappingURL=authMiddleware.d.ts.map