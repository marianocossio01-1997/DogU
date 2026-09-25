import { Router } from 'express';
import { validateCardPayment } from '../validators/PaymentValidator.js';
import { PaymentController } from '../controllers/PaymentController.js';

const router = Router();
router.post('/process', validateCardPayment, PaymentController.processPayment);

export default router;