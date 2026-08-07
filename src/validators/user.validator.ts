import { type } from "os";
import {z} from "zod";

export const createUserSchema = z.object({
    fullname: z.string().min(3, { message: "El nombre es obligatorio"}),
    email: z.string().refine((val) => /\S+@\S+\.\S+/.test(val), {message:"El correo electrónico no es válido"}),
    phone: z.string().min(5, { message: "Minimo 5 caracteres para el teléfono"}),
    password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres"}),
    role: z.string().optional() 
    .refine((val) => val === undefined || ['CLIENT', 'DRIVER'].includes(val), {
        message: "El rol debe ser 'CLIENT' o 'DRIVER'",
    }),
});
export const updateUserSchema = z.object({
    fullname: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres"}).optional(),
    phone: z.string().min(5, { message: "Minimo 5 caracteres para el teléfono"}).optional(),

});
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;