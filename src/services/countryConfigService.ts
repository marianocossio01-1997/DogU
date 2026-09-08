import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export class CountryConfigService {
  static async getPricingByCountryCode(countryCode: string) {
    const country = await prisma.countryConfig.findUnique({
      where: { country_code: countryCode.toUpperCase() },
      include: { pricing_configs: true },
    })
    if (!country || !country.is_active) {
      throw new Error(`El país '${countryCode}' no existe o no está activo`);
    }
    const pricing = country.pricing_configs[0];
    const rate = country.exchange_rate;
    return {
      country: country.country_name,
      country_code: country.country_code,
      currency_code: country.currency_code,
      currency_symbol: country.currency_symbol,
      exchange_rate: rate,
      pricing_usd: {
        base_fare: pricing?.base_fare_usd ?? 1.5,
        km_value: pricing?.km_value_usd ?? 0.5,
        min_value: pricing?.min_value_usd ?? 0.1,
      },
      pricing_local: {
        base_fare: (pricing?.base_fare_usd ?? 1.5) * rate,
        km_value: (pricing?.km_value_usd ?? 0.5) * rate,
        min_value: (pricing?.min_value_usd ?? 0.1) * rate,
      },
    };
  }
  static async updateExchangeRate(countryCode: string, exchangeRate: number) {
    return await prisma.countryConfig.update({
      where: { country_code: countryCode.toUpperCase() },
      data: { exchange_rate: exchangeRate },
    });
  }
}