declare const process: any;
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const countriesData = [
  // ─── AMÉRICA ────────────────────
  { country_code: 'AR', country_name: 'Argentina', currency_code: 'ARS', currency_symbol: '$', exchange_rate: 1550.0, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'CL', country_name: 'Chile', currency_code: 'CLP', currency_symbol: '$', exchange_rate: 950.0, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'BR', country_name: 'Brasil', currency_code: 'BRL', currency_symbol: 'R$', exchange_rate: 5.6, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'CO', country_name: 'Colombia', currency_code: 'COP', currency_symbol: '$', exchange_rate: 4100.0, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'PE', country_name: 'Perú', currency_code: 'PEN', currency_symbol: 'S/', exchange_rate: 3.75, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'MX', country_name: 'México', currency_code: 'MXN', currency_symbol: '$', exchange_rate: 19.5, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'US', country_name: 'Estados Unidos', currency_code: 'USD', currency_symbol: '$', exchange_rate: 1.0, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'UY', country_name: 'Uruguay', currency_code: 'UYU', currency_symbol: '$U', exchange_rate: 40.0, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'PY', country_name: 'Paraguay', currency_code: 'PYG', currency_symbol: '₲', exchange_rate: 7700.0, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'BO', country_name: 'Bolivia', currency_code: 'BOB', currency_symbol: 'Bs.', exchange_rate: 6.9, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'EC', country_name: 'Ecuador', currency_code: 'USD', currency_symbol: '$', exchange_rate: 1.0, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },

  // ─── EUROPA ─────────────────────
  { country_code: 'ES', country_name: 'España', currency_code: 'EUR', currency_symbol: '€', exchange_rate: 0.92, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'FR', country_name: 'Francia', currency_code: 'EUR', currency_symbol: '€', exchange_rate: 0.92, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'IT', country_name: 'Italia', currency_code: 'EUR', currency_symbol: '€', exchange_rate: 0.92, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'DE', country_name: 'Alemania', currency_code: 'EUR', currency_symbol: '€', exchange_rate: 0.92, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'PT', country_name: 'Portugal', currency_code: 'EUR', currency_symbol: '€', exchange_rate: 0.92, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'GB', country_name: 'Reino Unido', currency_code: 'GBP', currency_symbol: '£', exchange_rate: 0.78, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'CH', country_name: 'Suiza', currency_code: 'CHF', currency_symbol: 'CHF', exchange_rate: 0.88, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'NL', country_name: 'Países Bajos', currency_code: 'EUR', currency_symbol: '€', exchange_rate: 0.92, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'BE', country_name: 'Bélgica', currency_code: 'EUR', currency_symbol: '€', exchange_rate: 0.92, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'PL', country_name: 'Polonia', currency_code: 'PLN', currency_symbol: 'zł', exchange_rate: 3.95, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },

  // ─── ASIA & MEDIO ORIENTE ──────
  { country_code: 'JP', country_name: 'Japón', currency_code: 'JPY', currency_symbol: '¥', exchange_rate: 155.0, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'CN', country_name: 'China', currency_code: 'CNY', currency_symbol: '¥', exchange_rate: 7.25, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'KR', country_name: 'Corea del Sur', currency_code: 'KRW', currency_symbol: '₩', exchange_rate: 1380.0, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'IN', country_name: 'India', currency_code: 'INR', currency_symbol: '₹', exchange_rate: 83.5, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'TH', country_name: 'Tailandia', currency_code: 'THB', currency_symbol: '฿', exchange_rate: 36.5, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'ID', country_name: 'Indonesia', currency_code: 'IDR', currency_symbol: 'Rp', exchange_rate: 16200.0, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'PH', country_name: 'Filipinas', currency_code: 'PHP', currency_symbol: '₱', exchange_rate: 58.5, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'VN', country_name: 'Vietnam', currency_code: 'VND', currency_symbol: '₫', exchange_rate: 25400.0, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'AE', country_name: 'Emiratos Árabes Unidos', currency_code: 'AED', currency_symbol: 'AED', exchange_rate: 3.67, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
  { country_code: 'SG', country_name: 'Singapur', currency_code: 'SGD', currency_symbol: 'S$', exchange_rate: 1.35, base_fare_usd: 1.5, km_value_usd: 0.5, min_value_usd: 0.1 },
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