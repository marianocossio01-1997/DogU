import type { Request, Response, NextFunction } from 'express';

export const validateCardPayment = (req: Request, res: Response, next: NextFunction) => {
  const { token, paymentMethodId, transactionAmount, payerEmail } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: 'El token de la tarjeta es obligatorio' });
  }
  if (!paymentMethodId) {
    return res.status(400).json({ success: false, message: 'El método de pago (ej: visa, master) es obligatorio' });
  }
  if (!transactionAmount || typeof transactionAmount !== 'number' || transactionAmount <= 0) {
    return res.status(400).json({ success: false, message: 'El monto debe ser un número válido mayor a 0' });
  }
  if (!payerEmail) {
    return res.status(400).json({ success: false, message: 'El email del pagador es obligatorio' });
  }
  next();
};