import type { Request, Response } from 'express';
import { WithdrawalService } from '../services/WithdrawalService.js';
import { updateBankDetailsSchema, createWithdrawalSchema } from '../validators/WithdrawalValidator.js';

export class WithdrawalController {
  static async updateBankDetails(req: Request, res: Response): Promise<void> {
    try {
      const id_driver = Number(req.params.id_driver || (req as any).user?.id);
      const validatedData = updateBankDetailsSchema.parse(req.body);
      const updatedWallet = await WithdrawalService.updateBankDetails(id_driver, validatedData);
      res.status(200).json({
        success: true,
        message: 'Datos bancarios guardados correctamente.',
        data: updatedWallet,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.errors ? error.errors[0].message : error.message,
      });
    }
  }
  static async requestWithdrawal(req: Request, res: Response): Promise<void> {
    try {
      const id_driver = Number(req.params.id_driver || (req as any).user?.id);
      const { amount, notes } = createWithdrawalSchema.parse(req.body);

      const result = await WithdrawalService.requestWithdrawal(id_driver, amount, notes);

      res.status(201).json({
        success: true,
        message: 'Solicitud de retiro procesada correctamente.',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.errors ? error.errors[0].message : error.message,
      });
    }
  }
  static async getDriverWithdrawals(req: Request, res: Response): Promise<void> {
    try {
      const id_driver = Number(req.params.id_driver || (req as any).user?.id);
      const withdrawals = await WithdrawalService.getDriverWithdrawals(id_driver);
      res.status(200).json({
        success: true,
        data: withdrawals,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}