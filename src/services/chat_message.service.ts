import prisma from '../database/prismaClient.js';
import { AppError } from '../utils/AppError.js';

export const create = async (data: {
    id_client_request: number;
    id_sender: number;
    id_receiver: number;
    message: string;
}) => {
    try {
        const newMessage = await prisma.chatMessage.create({
            data: {
                id_client_request: data.id_client_request,
                id_sender: data.id_sender,
                id_receiver: data.id_receiver,
                message: data.message,
            }
        });
        return newMessage;
    } catch (e) {
        throw new AppError(`Error al guardar el mensaje: ${e}`, 500);
    }
};
export const getByTrip = async (id_client_request: number) => {
    try {
        const messages = await prisma.chatMessage.findMany({
            where: { id_client_request },
            orderBy: { created_at: 'asc' }
        });
        return messages;
    } catch (e) {
        throw new AppError(`Error al obtener los mensajes: ${e}`, 500);
    }
};