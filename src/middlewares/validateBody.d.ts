import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
export declare const validateBody: (schema: z.ZodTypeAny) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=validateBody.d.ts.map