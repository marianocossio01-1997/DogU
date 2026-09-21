import type { Request, Response, NextFunction } from 'express';
import * as UserCardService from '../services/user_card.service.js';
import { createUserCardSchema, setDefaultCardSchema } from '../validators/user_card.validator.js';

export const createCard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = createUserCardSchema.parse(req.body);
        const card = await UserCardService.createCard(validatedData as any);
        return res.status(201).json(card);
    } catch (error) {
        next(error);
    }
};
export const getCardsByUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id_user = Number(req.params.id_user);
        const cards = await UserCardService.getCardsByUser(id_user);
        return res.status(200).json(cards);
    } catch (error) {
        next(error);
    }
};
export const setDefaultCard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id_card, id_user } = setDefaultCardSchema.parse(req.body);
        const card = await UserCardService.setDefaultCard(id_card, id_user);
        return res.status(200).json(card);
    } catch (error) {
        next(error);
    }
};
export const deleteCard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id_card = Number(req.params.id_card);
        const id_user = Number(req.params.id_user);
        const result = await UserCardService.deleteCard(id_card, id_user);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};