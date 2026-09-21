import prisma from '../database/prismaClient.js';
import { AppError } from '../utils/AppError.js';

export const createCard = async (data: {
    id_user: number;
    card_holder_name: string;
    last_4: string;
    brand: string;
    expiration_month: number;
    expiration_year: number;
    card_token: string;
    is_default?: boolean;
}) => {
    try {
        const { id_user, is_default } = data;
        const existingCardsCount = await prisma.userCard.count({
            where: { id_user }
        });
        const shouldBeDefault = existingCardsCount === 0 || is_default === true;
        return await prisma.$transaction(async (tx) => {
            if (shouldBeDefault) {
                await tx.userCard.updateMany({
                    where: { id_user },
                    data: { is_default: false }
                });
            }
            const newCard = await tx.userCard.create({
                data: {
                    id_user: data.id_user,
                    card_holder_name: data.card_holder_name,
                    last_4: data.last_4,
                    brand: data.brand.toUpperCase(),
                    expiration_month: data.expiration_month,
                    expiration_year: data.expiration_year,
                    card_token: data.card_token,
                    is_default: shouldBeDefault
                }
            });

            return newCard;
        });
    } catch (e) {
        throw new AppError(`Error al guardar la tarjeta: ${e}`, 500);
    }
};
export const getCardsByUser = async (id_user: number) => {
    try {
        const cards = await prisma.userCard.findMany({
            where: { id_user },
            orderBy: [
                { is_default: 'desc' },
                { created_at: 'desc' }
            ]
        });
        return cards;
    } catch (e) {
        throw new AppError(`Error al obtener las tarjetas del usuario: ${e}`, 500);
    }
};
export const setDefaultCard = async (id_card: number, id_user: number) => {
    try {
        const cardExists = await prisma.userCard.findFirst({
            where: { id: id_card, id_user }
        });

        if (!cardExists) {
            throw new AppError('La tarjeta especificada no pertenece al usuario', 404);
        }
        return await prisma.$transaction(async (tx) => {
            await tx.userCard.updateMany({
                where: { id_user },
                data: { is_default: false }
            });
            const updatedCard = await tx.userCard.update({
                where: { id: id_card },
                data: { is_default: true }
            });

            return updatedCard;
        });
    } catch (e) {
        throw new AppError(`Error al establecer la tarjeta predeterminada: ${e}`, 500);
    }
};
export const deleteCard = async (id_card: number, id_user: number) => {
    try {
        const card = await prisma.userCard.findFirst({
            where: { id: id_card, id_user }
        });

        if (!card) {
            throw new AppError('Tarjeta no encontrada o no pertenece al usuario', 404);
        }
        return await prisma.$transaction(async (tx) => {
            await tx.userCard.delete({
                where: { id: id_card }
            });

            if (card.is_default) {
                const newestCard = await tx.userCard.findFirst({
                    where: { id_user },
                    orderBy: { created_at: 'desc' }
                });

                if (newestCard) {
                    await tx.userCard.update({
                        where: { id: newestCard.id },
                        data: { is_default: true }
                    });
                }
            }
            return { message: "Tarjeta eliminada correctamente" };
        });
    } catch (e) {
        throw new AppError(`Error al eliminar la tarjeta: ${e}`, 500);
    }
};