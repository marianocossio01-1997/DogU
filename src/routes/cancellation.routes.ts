import { Router } from 'express';
import * as CancellationController from '../controllers/cancellation.controller.js';

const router = Router();
router.post('/cancel', CancellationController.cancelTrip);

export default router;