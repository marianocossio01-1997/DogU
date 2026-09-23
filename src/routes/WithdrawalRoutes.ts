import { Router } from 'express';
import { WithdrawalController } from '../controllers/WithdrawalController.js';

const router = Router();
router.put('/bank-details/:id_driver', WithdrawalController.updateBankDetails);
router.post('/request/:id_driver', WithdrawalController.requestWithdrawal);
router.get('/history/:id_driver', WithdrawalController.getDriverWithdrawals);

export default router;