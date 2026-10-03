import type { Request, Response, NextFunction } from 'express';
import * as DriverWalletService from '../services/driver_wallet.service.js';
import { processTripPaymentSchema, addTransactionSchema } from '../validators/driver_wallet.validator.js';

export const getWalletByDriver = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rawDriverId = req.params.id_driver || req.params.idDriver || req.params.id || req.query.id_driver || req.query.id;
        const id_driver = Number(rawDriverId);
        if (isNaN(id_driver) || id_driver <= 0) {
            console.error(`🚨 [WalletController] ID recibido inválido: ${rawDriverId}`);
            return res.status(400).json({
                success: false,
                message: "El id_driver proporcionado es inválido o no existe en la petición."
            });
        }
        console.log(`🔎 [WalletController] Buscando billetera para id_driver: ${id_driver}`);
        const wallet = await DriverWalletService.getOrCreateWallet(id_driver);
        console.log(`✅ [WalletController] Billetera encontrada. Balance real: ${wallet?.balance} para id_driver: ${id_driver}`);
        return res.status(200).json(wallet);
    } catch (error) {
        console.error("🚨 [WalletController Error en getWalletByDriver]:", error);
        next(error);
    }
};
export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rawDriverId = req.params.id_driver || req.params.idDriver || req.params.id || req.query.id_driver;
        const id_driver = Number(rawDriverId);

        if (isNaN(id_driver) || id_driver <= 0) {
            return res.status(400).json({
                success: false,
                message: "El id_driver proporcionado es inválido."
            });
        }
        const transactions = await DriverWalletService.getTransactions(id_driver);
        return res.status(200).json(transactions);
    } catch (error) {
        next(error);
    }
};
export const processTripPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = processTripPaymentSchema.parse(req.body);
        const result = await DriverWalletService.processTripPayment(validatedData as any);
        
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
export const addTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = addTransactionSchema.parse(req.body);
        const result = await DriverWalletService.addTransaction(validatedData as any);
        return res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};