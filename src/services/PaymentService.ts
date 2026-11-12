import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || ''
});
const payment = new Payment(client);
interface CardPaymentInput {
  token: string;
  issuerId?: string;
  paymentMethodId: string;
  transactionAmount: number;
  applicationFee?: number;
  payerEmail: string;
  description: string;
}
export const processCardPayment = async ({
  token,
  issuerId,
  paymentMethodId,
  transactionAmount,
  applicationFee,
  payerEmail,
  description
}: CardPaymentInput) => {
  try {
    const bodyData: Record<string, any> = {
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
    if (applicationFee && applicationFee > 0) {
      bodyData.application_fee = applicationFee;
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