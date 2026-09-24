import prisma from '../database/prismaClient.js';
import { AppError } from '../utils/AppError.js';
import { TransactionType, PaymentMethod } from '@prisma/client';

export const getOrCreateWallet = async (id_driver: number) => {
    try {
        let wallet = await prisma.driverWallet.findUnique({
            where: { id_driver },
            include: {
                transactions: {
                    orderBy: { created_at: 'desc' },
                    take: 20
                }
            }
        });
        if (!wallet) {
            wallet = await prisma.driverWallet.create({
                data: {
                    id_driver,
                    balance: 0.0
                },
                include: {
                    transactions: true
                }
            });
        }
        return wallet;
    } catch (e) {
        throw new AppError(`Error al obtener o crear la billetera del conductor: ${e}`, 500);
    }
};
export const getTransactions = async (id_driver: number) => {
    try {
        const transactions = await prisma.walletTransaction.findMany({
            where: { id_driver_wallet: id_driver },
            orderBy: { created_at: 'desc' },
            include: {
                client_request: {
                    select: {
                        pickup_description: true,
                        destination_description: true,
                        created_at: true
                    }
                }
            }
        });
        return transactions;
    } catch (e) {
        throw new AppError(`Error al obtener el historial de transacciones: ${e}`, 500);
    }
};
export const processTripPayment = async (data: {
    id_client_request: number;
    id_driver: number;
    total_fare: number;
    payment_method: PaymentMethod;
}) => {
    try {
        const { id_client_request, id_driver, total_fare, payment_method } = data;
        const commissionRate = 0.20;
        const platformFee = total_fare * commissionRate; 
        const driverEarnings = total_fare * (1 - commissionRate); 
        await getOrCreateWallet(id_driver);
        return await prisma.$transaction(async (tx) => {
            const existingTx = await tx.walletTransaction.findFirst({
                where: { id_client_request }
            });

            if (existingTx) {
                console.log(`El viaje #${id_client_request} ya fue procesado previamente en la billetera.`);
                const currentWallet = await tx.driverWallet.findUnique({
                    where: { id_driver }
                });

                return {
                    wallet: currentWallet,
                    transaction: existingTx,
                    platform_fee: platformFee,
                    driver_earnings: driverEarnings
                };
            }
            let amountTransaction = 0;
            let type: TransactionType;
            let description = '';
            if (payment_method === PaymentMethod.CASH) {
                amountTransaction = -platformFee;
                type = TransactionType.TRIP_COMMISSION_DEBIT;
                description = `Comisión del 20% por viaje #${id_client_request} (Pago en efectivo)`;
            } else {
                amountTransaction = driverEarnings;
                type = TransactionType.TRIP_EARNING_CREDIT;
                description = `Acreditación del 80% por viaje #${id_client_request} (Pago con tarjeta)`;
            }
            await tx.clientRequests.update({
                where: { id: id_client_request },
                data: {
                    platform_fee: platformFee,
                    driver_earnings: driverEarnings,
                    payment_method: payment_method,
                    payment_status: payment_method === PaymentMethod.CARD ? 'PAID' : 'PENDING'
                }
            });
            const updatedWallet = await tx.driverWallet.update({
                where: { id_driver },
                data: {
                    balance: {
                        increment: amountTransaction
                    }
                }
            });
            const newTransaction = await tx.walletTransaction.create({
                data: {
                    id_driver_wallet: id_driver,
                    id_client_request: id_client_request,
                    amount: amountTransaction,
                    type: type,
                    description: description
                }
            });
            return {
                wallet: updatedWallet,
                transaction: newTransaction,
                platform_fee: platformFee,
                driver_earnings: driverEarnings
            };
        });
    } catch (e) {
        throw new AppError(`Error al procesar el pago del viaje en la billetera: ${e}`, 500);
    }
};
export const requestWithdrawal = async (data: {
    id_driver: number;
    amount: number;
    id_card?: number;
    notes?: string;
}) => {
    try {
        const { id_driver, amount, id_card, notes } = data;
        const wallet = await getOrCreateWallet(id_driver);
        if (wallet.balance < amount) {
            throw new AppError('Saldo insuficiente para realizar el retiro', 400);
        }
        return await prisma.$transaction(async (tx) => {
            const updatedWallet = await tx.driverWallet.update({
                where: { id_driver },
                data: {
                    balance: {
                        decrement: amount
                    }
                }
            });
            const withdrawal = await tx.withdrawalRequest.create({
                data: {
                    id_driver_wallet: id_driver,
                    id_card: id_card ?? null,
                    amount: amount,
                    notes: notes ?? null,
                    status: 'PENDING'
                }
            });
            const transaction = await tx.walletTransaction.create({
                data: {
                    id_driver_wallet: id_driver,
                    amount: -amount,
                    type: TransactionType.WITHDRAWAL,
                    description: `Solicitud de retiro de ganancias \$${amount}`
                }
            });
            return {
                new_balance: updatedWallet.balance,
                withdrawal,
                transaction
            };
        });
    } catch (e) {
        throw new AppError(`Error al procesar la solicitud de retiro: ${e}`, 500);
    }
};
export const addTransaction = async (data: {
    id_driver: number;
    id_client_request?: number;
    amount: number;
    type: TransactionType;
    description: string;
}) => {
    try {
        const { id_driver, id_client_request, amount, type, description } = data;
        await getOrCreateWallet(id_driver);

        return await prisma.$transaction(async (tx) => {
            const updatedWallet = await tx.driverWallet.update({
                where: { id_driver },
                data: {
                    balance: {
                        increment: amount
                    }
                }
            });
            const newTransaction = await tx.walletTransaction.create({
                data: {
                    id_driver_wallet: id_driver,
                    id_client_request: id_client_request ?? null,
                    amount,
                    type,
                    description
                }
            });

            return { wallet: updatedWallet, transaction: newTransaction };
        });
    } catch (e) {
        throw new AppError(`Error al agregar la transacción: ${e}`, 500);
    }
};