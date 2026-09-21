import { Router } from 'express';
import * as DriverWalletController from '../controllers/driver_wallet.controller.js';

const router = Router();

router.get('/driver/:id_driver', DriverWalletController.getWalletByDriver);
router.get('/transactions/:id_driver', DriverWalletController.getTransactions);
router.post('/process-trip-payment', DriverWalletController.processTripPayment);
router.post('/add-transaction', DriverWalletController.addTransaction);

export default router;