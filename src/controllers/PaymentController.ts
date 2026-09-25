import type { Request, Response } from 'express';
import { processCardPayment } from '../services/PaymentService.js';

export class PaymentController {
  static async processPayment(req: Request, res: Response) {
    try {
      const { token, issuerId, paymentMethodId, transactionAmount, payerEmail, description } = req.body;
      const result = await processCardPayment({
        token,
        issuerId,
        paymentMethodId,
        transactionAmount,
        payerEmail,
        description: description || 'Cobro de viaje'
      });
      if (result.status === 'approved') {
        return res.status(200).json({
          success: true,
          message: 'Pago aprobado exitosamente',
          paymentId: result.id,
          status: result.status
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'El pago no pudo ser aprobado',
          status: result.status,
          detail: result.status_detail
        });
      }
    } catch (error: any) {
      console.error('Error en PaymentController:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno al procesar el pago',
        error: error.message
      });
    }
  }
}