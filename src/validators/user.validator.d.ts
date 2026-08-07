import { z } from "zod";
export declare const createUserSchema: z.ZodObject<{
    fullname: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    password: z.ZodString;
    role: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateUserSchema: z.ZodObject<{
    fullname: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
//# sourceMappingURL=user.validator.d.ts.map