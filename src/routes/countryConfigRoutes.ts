import { Router } from 'express';
import { CountryConfigController } from '../controllers/countryConfigController.js';

const router = Router();
router.get('/:code', CountryConfigController.getPricing);
router.put('/:code/exchange-rate', CountryConfigController.updateExchangeRate);

export default router;