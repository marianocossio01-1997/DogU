import type { Request, Response, NextFunction } from 'express';
import * as DriverWalletService from '../services/driver_wallet.service.js';
import { processTripPaymentSchema, addTransactionSchema } from '../validators/driver_wallet.validator.js';

export const getWalletByDriver = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rawId = req.params.id_driver ?? req.params.idDriver ?? req.params.id;
        const id_driver = Number(rawId);

        if (isNaN(id_driver) || id_driver <= 0) {
            return res.status(400).json({
                success: false,
                message: "El id_driver proporcionado es inválido o no existe en la petición."
            });
        }
        console.log(`🔎 [WalletController] Obteniendo billetera para id_driver: ${id_driver}`);
        const wallet = await DriverWalletService.getOrCreateWallet(id_driver);
        return res.status(200).json({
            success: true,
            data: wallet
        });
    } catch (error) {
        next(error);
    }
};
export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rawId = req.params.id_driver ?? req.params.idDriver ?? req.params.id;
        const id_driver = Number(rawId);

        if (isNaN(id_driver) || id_driver <= 0) {
            return res.status(400).json({
                success: false,
                message: "El id_driver proporcionado es inválido."
            });
        }
        const transactions = await DriverWalletService.getTransactions(id_driver);
        return res.status(200).json({
            success: true,
            data: transactions
        });
    } catch (error) {
        next(error);
    }
};
export const processTripPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = processTripPaymentSchema.parse(req.body);
        const result = await DriverWalletService.processTripPayment(validatedData as any);
        
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};
export const addTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = addTransactionSchema.parse(req.body);
        const result = await DriverWalletService.addTransaction(validatedData as any);
        
        return res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};