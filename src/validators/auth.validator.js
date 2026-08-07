import { z } from 'zod';
export const loginSchema = z.object({
    email: z.string().refine((val) => /\S+@\S+\.\S+/.test(val), { message: "El correo electrónico no es válido" }),
    password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});
//# sourceMappingURL=auth.validator.js.map