import { z } from 'zod';

export const updateBankDetailsSchema = z.object({
  bank_name: z.string().min(2, 'El nombre del banco es obligatorio'),
  cbu_cvu: z.string().length(22, 'El CBU/CVU debe tener exactamente 22 dígitos').optional().or(z.literal('')),
  alias: z.string().min(3, 'El alias debe tener al menos 3 caracteres').optional().or(z.literal('')),
  account_holder_name: z.string().min(3, 'El nombre del titular es obligatorio'),
  tax_id: z.string().min(7, 'El CUIT/CUIL/DNI no es válido'),
}).refine((data) => data.cbu_cvu || data.alias, {
  message: 'Debes proporcionar al menos un CBU/CVU o un Alias para recibir transferencias',
  path: ['cbu_cvu'],
});
export const createWithdrawalSchema = z.object({
  amount: z.number().positive('El monto a retirar debe ser mayor a 0'),
  notes: z.string().optional(),
});