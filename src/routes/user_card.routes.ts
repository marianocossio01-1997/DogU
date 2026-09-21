import { Router } from 'express';
import * as UserCardController from '../controllers/user_card.controller.js';

const router = Router();
router.post('/create', UserCardController.createCard);
router.get('/user/:id_user', UserCardController.getCardsByUser);
router.put('/set-default', UserCardController.setDefaultCard);
router.delete('/:id_card/user/:id_user', UserCardController.deleteCard);

export default router;