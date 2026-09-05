import { Router } from 'express';
import * as ChatMessageController from '../controllers/chat_message.controller.js';

const router = Router();

router.post('/create', ChatMessageController.create);
router.get('/messages/:id_client_request', ChatMessageController.getByTrip);

export default router;