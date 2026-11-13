import prisma from '../database/prismaClient.js';
import { AppError } from '../utils/AppError.js';
import { processCardPayment } from './PaymentService.js';
import type { CancelTripInput } from '../validators/cancellation.validator.js';

export const cancelTrip = async (data: CancelTripInput) => {
    try {
        return await prisma.$transaction(async (tx) => {
            const trip = await tx.clientRequests.findUnique({
                where: { id: data.id_client_request },
                include: { client: true }
            });
            if (!trip) {
                throw new AppError('El viaje no existe', 404);
            }
            if (trip.status === 'CANCELLED') {
                throw new AppError('El viaje ya ha sido cancelado previamente', 400);
            }
            if (trip.status === 'FINISHED') {
                throw new AppError('No se puede cancelar un viaje que ya ha finalizado', 400);
            }
            const fareToCalculate = trip.fare_assigned ?? trip.fare_offered ?? 0;
            const CANCELLATION_RATE = 0.15; 
            const cancellationFee = Number((fareToCalculate * CANCELLATION_RATE).toFixed(2));
            if (data.cancelled_by === 'CLIENT' && trip.payment_method === 'CARD' && trip.id_card) {
                const userCard = await tx.userCard.findUnique({
                    where: { id: trip.id_card }
                });
                if (userCard) {
                    try {
                        await processCardPayment({
                            token: userCard.card_token,
                            paymentMethodId: userCard.brand.toLowerCase(),
                            transactionAmount: cancellationFee,
                            applicationFee: cancellationFee, 
                            payerEmail: trip.client.email,
                            description: `Cargo por cancelación de viaje DogU #${trip.id}`
                        });
                    } catch (paymentErr) {
                        console.error("⚠️ No se pudo cobrar la tarifa de cancelación a la tarjeta del cliente:", paymentErr);
                    }
                }
            }
            const updatedTrip = await tx.clientRequests.update({
                where: { id: data.id_client_request },
                data: {
                    status: 'CANCELLED',
                    cancelled_by: data.cancelled_by,
                    cancellation_reason: data.cancellation_reason ?? 'Sin motivo especificado',
                    cancellation_fee: cancellationFee
                }
            });
            if (trip.id_driver_assigned) {
                const driverWallet = await tx.driverWallet.findUnique({
                    where: { id_driver: trip.id_driver_assigned }
                });
                if (driverWallet) {
                    if (data.cancelled_by === 'CLIENT') {
                        await tx.driverWallet.update({
                            where: { id_driver: trip.id_driver_assigned },
                            data: { balance: { increment: cancellationFee } }
                        });
                        await tx.walletTransaction.create({
                            data: {
                                id_driver_wallet: trip.id_driver_assigned,
                                id_client_request: trip.id,
                                amount: cancellationFee,
                                type: 'CANCELLATION_FEE',
                                description: `Compensación por cancelación de cliente (15% del viaje #${trip.id})`
                            }
                        });
                    } else if (data.cancelled_by === 'DRIVER') {
                        await tx.driverWallet.update({
                            where: { id_driver: trip.id_driver_assigned },
                            data: { balance: { decrement: cancellationFee } }
                        });
                        await tx.walletTransaction.create({
                            data: {
                                id_driver_wallet: trip.id_driver_assigned,
                                id_client_request: trip.id,
                                amount: -cancellationFee,
                                type: 'CANCELLATION_FEE',
                                description: `Penalización por cancelación de viaje #${trip.id} (15%)`
                            }
                        });
                    }
                }
            }
            return updatedTrip;
        });
    } catch (e: any) {
        if (e instanceof AppError) throw e;
        throw new AppError(`Error al cancelar el viaje: ${e.message || e}`, 500);
    }
};