declare const process: any;
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const countriesData = [
  {
    country_code: 'AR',
    country_name: 'Argentina',
    currency_code: 'ARS',
    currency_symbol: '$',
    exchange_rate: 1550.0,
    base_fare_usd: 1.5,
    km_value_usd: 0.5,
    min_value_usd: 0.1,
  },
  {
    country_code: 'CL',
    country_name: 'Chile',
    currency_code: 'CLP',
    currency_symbol: '$',
    exchange_rate: 950.0,
    base_fare_usd: 1.5,
    km_value_usd: 0.5,
    min_value_usd: 0.1,
  },
  {
    country_code: 'BR',
    country_name: 'Brasil',
    currency_code: 'BRL',
    currency_symbol: 'R$',
    exchange_rate: 5.6,
    base_fare_usd: 1.5,
    km_value_usd: 0.5,
    min_value_usd: 0.1,
  },
  {
    country_code: 'CO',
    country_name: 'Colombia',
    currency_code: 'COP',
    currency_symbol: '$',
    exchange_rate: 4100.0,
    base_fare_usd: 1.5,
    km_value_usd: 0.5,
    min_value_usd: 0.1,
  },
  {
    country_code: 'MX',
    country_name: 'México',
    currency_code: 'MXN',
    currency_symbol: '$',
    exchange_rate: 19.5,
    base_fare_usd: 1.5,
    km_value_usd: 0.5,
    min_value_usd: 0.1,
  },
  {
    country_code: 'US',
    country_name: 'Estados Unidos',
    currency_code: 'USD',
    currency_symbol: '$',
    exchange_rate: 1.0,
    base_fare_usd: 1.5,
    km_value_usd: 0.5,
    min_value_usd: 0.1,
  },
];
async function main() {
  console.log('🌱 Poblando base de datos con países y tarifas...');
  for (const item of countriesData) {
    const country = await prisma.countryConfig.upsert({
      where: { country_code: item.country_code },
      update: {
        country_name: item.country_name,
        currency_code: item.currency_code,
        currency_symbol: item.currency_symbol,
        exchange_rate: item.exchange_rate,
      },
      create: {
        country_code: item.country_code,
        country_name: item.country_name,
        currency_code: item.currency_code,
        currency_symbol: item.currency_symbol,
        exchange_rate: item.exchange_rate,
        is_active: true,
      },
    });
    const existingPricing = await prisma.pricingConfig.findFirst({
      where: { id_country: country.id },
    });
    if (existingPricing) {
      await prisma.pricingConfig.update({
        where: { id: existingPricing.id },
        data: {
          base_fare_usd: item.base_fare_usd,
          km_value_usd: item.km_value_usd,
          min_value_usd: item.min_value_usd,
        },
      });
    } else {
      await prisma.pricingConfig.create({
        data: {
          id_country: country.id,
          base_fare_usd: item.base_fare_usd,
          km_value_usd: item.km_value_usd,
          min_value_usd: item.min_value_usd,
        },
      });
    }
    console.log(`✅ ${item.country_name} (${item.country_code}) configurado.`);
  }
  console.log('🚀 Seed completado con éxito.');
}
main()
  .catch((e) => {
    console.error('🚨 Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });