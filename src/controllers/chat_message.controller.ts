import type { Request, Response, NextFunction } from 'express';
import * as ChatMessageService from '../services/chat_message.service.js';

export const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        const message = await ChatMessageService.create(data);
        return res.status(201).json(message);
    } catch (error) {
        next(error);
    }
};
export const getByTrip = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id_client_request = Number(req.params.id_client_request);
        const messages = await ChatMessageService.getByTrip(id_client_request);
        return res.status(200).json(messages);
    } catch (error) {
        next(error);
    }
};