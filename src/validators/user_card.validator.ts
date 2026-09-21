import { z } from 'zod';

export const createUserCardSchema = z.object({
    id_user: z.number({ message: "El ID de usuario debe ser un número" }).int().positive(),
    card_holder_name: z.string().min(2, "El nombre del titular es requerido").max(100),
    last_4: z.string().length(4, "Debe contener exactamente los últimos 4 dígitos"),
    brand: z.string().min(2, "La marca de la tarjeta es requerida").max(30),
    expiration_month: z.number().int().min(1).max(12),
    expiration_year: z.number().int().min(2024),
    card_token: z.string().min(1, "El token de la tarjeta es requerido").max(255),
    is_default: z.boolean().optional().default(false),
});
export const setDefaultCardSchema = z.object({
    id_card: z.number({ message: "El ID de la tarjeta debe ser un número" }).int().positive(),
    id_user: z.number({ message: "El ID de usuario debe ser un número" }).int().positive(),
});