import type { Request, Response, NextFunction } from 'express';
import * as DriverWalletService from '../services/driver_wallet.service.js';
import { processTripPaymentSchema, addTransactionSchema } from '../validators/driver_wallet.validator.js';

export const getWalletByDriver = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id_driver = Number(req.params.id_driver);
        const wallet = await DriverWalletService.getOrCreateWallet(id_driver);
        return res.status(200).json(wallet);
    } catch (error) {
        next(error);
    }
};
export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id_driver = Number(req.params.id_driver);
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