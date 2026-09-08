import { z } from 'zod';

export const updateCountryConfigSchema = z.object({
  exchange_rate: z.number().positive('El tipo de cambio debe ser mayor a 0').optional(),
  is_active: z.boolean().optional(),
});
export const updatePricingConfigSchema = z.object({
  base_fare_usd: z.number().positive('La tarifa base en USD debe ser mayor a 0').optional(),
  km_value_usd: z.number().nonnegative('El valor por KM en USD debe ser mayor o igual a 0').optional(),
  min_value_usd: z.number().nonnegative('El valor por minuto en USD debe ser mayor o igual a 0').optional(),
});