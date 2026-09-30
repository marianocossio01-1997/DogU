import { PaymentMethod, TransactionType } from '@prisma/client';
import prisma from '../database/prismaClient.js';
import { AppError } from '../utils/AppError.js';

export const getOrCreateWallet = async (id_driver: number) => {
    try {
        if (!id_driver || isNaN(id_driver)) {
            throw new AppError('El ID del conductor ingresado no es válido.', 400);
        }
        let wallet = await prisma.driverWallet.findFirst({
            where: { id_driver },
            include: {
                transactions: {
                    orderBy: { created_at: 'desc' },
                    take: 20
                }
            }
        });
        if (!wallet) {
            const carInfo = await prisma.driverCarInfo.findFirst({
                where: {
                    OR: [
                        { id_driver: id_driver },
                        { driver: { id: id_driver } }
                    ]
                }
            });
            if (carInfo && carInfo.id_driver) {
                wallet = await prisma.driverWallet.findFirst({
                    where: { id_driver: carInfo.id_driver },
                    include: {
                        transactions: {
                            orderBy: { created_at: 'desc' },
                            take: 20
                        }
                    }
                });
            }
        }
        if (!wallet) {
            const userWithWallet = await prisma.user.findUnique({
                where: { id: id_driver },
                include: {
                    driverWallet: {
                        include: {
                            transactions: {
                                orderBy: { created_at: 'desc' },
                                take: 20
                            }
                        }
                    }
                }
            });

            if (userWithWallet?.driverWallet) {
                wallet = userWithWallet.driverWallet;
            }
        }
        if (!wallet) {
            console.log(`⚠️ Creando nueva billetera inicial para id_driver: ${id_driver}`);
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
    } catch (e: any) {
        if (e instanceof AppError) throw e;
        throw new AppError(`Error al obtener o crear la billetera del conductor: ${e.message || e}`, 500);
    }
};
export const getTransactions = async (id_driver: number) => {
    try {
        const wallet = await getOrCreateWallet(id_driver);
        const walletId = wallet.id_driver;
        const transactions = await prisma.walletTransaction.findMany({
            where: { id_driver_wallet: walletId },
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
    } catch (e: any) {
        if (e instanceof AppError) throw e;
        throw new AppError(`Error al obtener el historial de transacciones: ${e.message || e}`, 500);
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
        const wallet = await getOrCreateWallet(id_driver);
        const targetDriverId = wallet.id_driver;
        return await prisma.$transaction(async (tx) => {
            const existingTx = await tx.walletTransaction.findFirst({
                where: { id_client_request }
            });

            if (existingTx) {
                console.log(`⚠️ El viaje #${id_client_request} ya fue procesado previamente en la billetera.`);
                const currentWallet = await tx.driverWallet.findFirst({
                    where: { id_driver: targetDriverId }
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
                description = `Acreditación del 80% por viaje #${id_client_request} (Pago digital)`;
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
                where: { id_driver: targetDriverId },
                data: {
                    balance: {
                        increment: amountTransaction
                    }
                }
            });
            const newTransaction = await tx.walletTransaction.create({
                data: {
                    id_driver_wallet: targetDriverId,
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
    } catch (e: any) {
        if (e instanceof AppError) throw e;
        throw new AppError(`Error al procesar el pago del viaje en la billetera: ${e.message || e}`, 500);
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
        const targetDriverId = wallet.id_driver;
        if (Number(wallet.balance) < amount) {
            throw new AppError('Saldo insuficiente para realizar el retiro', 400);
        }
        return await prisma.$transaction(async (tx) => {
            const updatedWallet = await tx.driverWallet.update({
                where: { id_driver: targetDriverId },
                data: {
                    balance: {
                        decrement: amount
                    }
                }
            });
            const withdrawal = await tx.withdrawalRequest.create({
                data: {
                    id_driver_wallet: targetDriverId,
                    id_card: id_card ?? null,
                    amount: amount,
                    notes: notes ?? null,
                    status: 'PENDING'
                }
            });
            const transaction = await tx.walletTransaction.create({
                data: {
                    id_driver_wallet: targetDriverId,
                    amount: -amount,
                    type: TransactionType.WITHDRAWAL,
                    description: `Solicitud de retiro de ganancias $${amount}`
                }
            });
            return {
                new_balance: updatedWallet.balance,
                withdrawal,
                transaction
            };
        });
    } catch (e: any) {
        if (e instanceof AppError) throw e;
        throw new AppError(`Error al procesar la solicitud de retiro: ${e.message || e}`, 500);
    }
};
export const getWithdrawalHistory = async (id_driver: number) => {
    try {
        const wallet = await getOrCreateWallet(id_driver);
        return await prisma.withdrawalRequest.findMany({
            where: { id_driver_wallet: wallet.id_driver },
            orderBy: { created_at: 'desc' }
        });
    } catch (e: any) {
        if (e instanceof AppError) throw e;
        throw new AppError(`Error al obtener el historial de retiros: ${e.message || e}`, 500);
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
        const wallet = await getOrCreateWallet(id_driver);
        const targetDriverId = wallet.id_driver;

        return await prisma.$transaction(async (tx) => {
            const updatedWallet = await tx.driverWallet.update({
                where: { id_driver: targetDriverId },
                data: {
                    balance: {
                        increment: amount
                    }
                }
            });
            const newTransaction = await tx.walletTransaction.create({
                data: {
                    id_driver_wallet: targetDriverId,
                    id_client_request: id_client_request ?? null,
                    amount,
                    type,
                    description
                }
            });
            return { wallet: updatedWallet, transaction: newTransaction };
        });
    } catch (e: any) {
        if (e instanceof AppError) throw e;
        throw new AppError(`Error al agregar la transacción: ${e.message || e}`, 500);
    }
};