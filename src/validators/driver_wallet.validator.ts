import { z } from 'zod';
import { TransactionType } from '@prisma/client';

export const processTripPaymentSchema = z.object({
    id_client_request: z.number().int().positive("El ID de la solicitud de viaje debe ser válido"),
    id_driver: z.number().int().positive("El ID del conductor debe ser válido"),
    total_fare: z.number().positive("La tarifa total debe ser mayor a 0"),
    payment_method: z.enum(['CASH', 'CARD']),
});
export const addTransactionSchema = z.object({
    id_driver: z.number().int().positive("El ID del conductor debe ser válido"),
    id_client_request: z.number().int().positive().optional(),
    amount: z.number("El monto debe ser un número"),
    type: z.nativeEnum(TransactionType),
    description: z.string().min(1, "La descripción es requerida").max(255),
});