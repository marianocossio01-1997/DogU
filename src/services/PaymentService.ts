import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN! 
});
const payment = new Payment(client);
export const processCardPayment = async ({
  token,
  issuerId,
  paymentMethodId,
  transactionAmount,
  payerEmail,
  description
}: {
  token: string;
  issuerId?: string;
  paymentMethodId: string;
  transactionAmount: number;
  payerEmail: string;
  description: string;
}) => {
  try {
    const bodyData: any = {
      token,
      payment_method_id: paymentMethodId,
      transaction_amount: transactionAmount,
      description,
      payer: {
        email: payerEmail,
      },
    };
    if (issuerId) {
      bodyData.issuer_id = issuerId;
    }
    const response = await payment.create({
      body: bodyData,
    });
    return response;
  } catch (error) {
    console.error('Error procesando pago con MP:', error);
    throw new Error('No se pudo procesar el pago');
  }
};