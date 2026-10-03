import { Router } from 'express';
import * as DriverWalletController from '../controllers/driver_wallet.controller.js';
import { getWalletByDriver } from '../controllers/driver_wallet.controller.js';

const router = Router();
router.get('/:id_driver', getWalletByDriver);
router.get('/transactions/:id_driver', DriverWalletController.getTransactions);
router.post('/process-trip-payment', DriverWalletController.processTripPayment);
router.post('/add-transaction', DriverWalletController.addTransaction);

export default router;