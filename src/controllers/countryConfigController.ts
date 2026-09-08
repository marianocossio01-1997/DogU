import type { Request, Response } from 'express';
import { CountryConfigService } from '../services/countryConfigService.js';
import { updateCountryConfigSchema } from '../validators/countryConfigValidator.js';

interface CountryParams {
  code: string;
}
export class CountryConfigController {
  static async getPricing(req: Request<CountryParams>, res: Response) {
    try {
      const code = req.params.code;
      const data = await CountryConfigService.getPricingByCountryCode(code);
      return res.status(200).json({ ok: true, data });
    } catch (error: any) {
      return res.status(400).json({ ok: false, message: error.message });
    }
  }
  static async updateExchangeRate(req: Request<CountryParams>, res: Response) {
    try {
      const code = req.params.code;
      const validatedData = updateCountryConfigSchema.parse(req.body);

      if (!validatedData.exchange_rate) {
        return res.status(400).json({ ok: false, message: 'Se requiere el campo exchange_rate' });
      }
      const updated = await CountryConfigService.updateExchangeRate(code, validatedData.exchange_rate);
      return res.status(200).json({ ok: true, message: 'Tipo de cambio actualizado', data: updated });
    } catch (error: any) {
      return res.status(400).json({ ok: false, message: error.message });
    }
  }
}