import { PaymentMethod, TransactionType, WithdrawalStatus } from '@prisma/client';
import prisma from '../database/prismaClient.js';
import { AppError } from '../utils/AppError.js';
import { getIO } from '../sockets/socketHandler.js';
import axios from 'axios';

export const getOrCreateWallet = async (id_driver: number) => {
    try {
        if (!id_driver || isNaN(id_driver) || id_driver <= 0) {
            throw new AppError('El id_driver proporcionado no es válido.', 400);
        }
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
            console.log(`✨ Creando nueva billetera ($0.0) para el conductor ID: ${id_driver}`);
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
        console.log(`💰 [DRIVER WALLET SERVICE] Balance devuelto para driver ${wallet.id_driver}: ${wallet.balance}`);
        return wallet;
    } catch (e: any) {
        if (e instanceof AppError) throw e;
        throw new AppError(`Error al obtener o crear la billetera del conductor: ${e.message || e}`, 500);
    }
};
export const getTransactions = async (id_driver: number) => {
    try {
        const wallet = await getOrCreateWallet(id_driver);
        const transactions = await prisma.walletTransaction.findMany({
            where: { id_driver_wallet: wallet.id_driver },
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
        const result = await prisma.$transaction(async (tx) => {
            const existingTx = await tx.walletTransaction.findFirst({
                where: { id_client_request }
            });
            if (existingTx) {
                console.log(`⚠️ El viaje #${id_client_request} ya fue procesado previamente.`);
                const currentWallet = await tx.driverWallet.findUnique({
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
                description = `Comisión del 20% por viaje #${id_client_request} (Efectivo)`;
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
        if (result.wallet) {
            try {
                getIO().emit(`wallet_updated/${targetDriverId}`, {
                    id_driver: targetDriverId,
                    new_balance: Number(result.wallet.balance)
                });
                console.log(`📡 [SOCKET] Saldo emitido a 'wallet_updated/${targetDriverId}': $${result.wallet.balance}`);
            } catch (socketErr) {
                console.warn("⚠️ No se pudo emitir por socket:", socketErr);
            }
        }
        return result;
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
        const { id_driver, amount, notes } = data;
        const wallet = await getOrCreateWallet(id_driver);
        const targetDriverId = wallet.id_driver;
        if (amount < 2000) {
            throw new AppError('El monto mínimo para retirar es de $2.000', 400);
        }
        if (Number(wallet.balance) < amount) {
            throw new AppError('Saldo insuficiente para realizar el retiro', 400);
        }
        if (!wallet.cbu_cvu && !wallet.alias) {
            throw new AppError('Debes registrar un CBU/CVU o Alias en tu perfil antes de solicitar un retiro', 400);
        }
        let mpTransferId = '';
        try {
            const mpAccessToken = process.env.MP_ACCESS_TOKEN;
            if (!mpAccessToken) {
                throw new AppError('Error de configuración del servidor (MP_ACCESS_TOKEN no definido)', 500);
            }
            const transferResponse = await axios.post(
                'https://api.mercadopago.com/v1/transfers',
                {
                    amount: amount,
                    description: `Retiro de ganancias DogU para conductor #${targetDriverId}`,
                    receiver_allocation: {
                        ...(wallet.cbu_cvu ? { cbu: wallet.cbu_cvu } : { alias: wallet.alias })
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${mpAccessToken}`,
                        'Content-Type': 'application/json',
                        'X-Idempotency-Key': `withdrawal_${targetDriverId}_${Date.now()}` 
                    }
                }
            );
            if (transferResponse.data && transferResponse.data.id) {
                mpTransferId = transferResponse.data.id.toString();
            }
        } catch (mpError: any) {
            console.error("🚨 Error ejecutando la transferencia saliente en Mercado Pago:", mpError?.response?.data || mpError?.message);
            throw new AppError(
                `No se pudo procesar la transferencia bancaria: ${mpError?.response?.data?.message || 'Revisá tus datos bancarios de cobro.'}`,
                400
            );
        }
        const result = await prisma.$transaction(async (tx) => {
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
                    id_card: data.id_card ?? null,
                    amount: amount,
                    notes: notes ? `${notes} (MP Transfer ID: ${mpTransferId})` : `MP Transfer ID: ${mpTransferId}`,
                    status: WithdrawalStatus.APPROVED 
                }
            });
            const transaction = await tx.walletTransaction.create({
                data: {
                    id_driver_wallet: targetDriverId,
                    amount: -amount,
                    type: TransactionType.WITHDRAWAL,
                    description: `Retiro automático a ${wallet.cbu_cvu || wallet.alias} ($${amount})`
                }
            });
            return {
                new_balance: updatedWallet.balance,
                withdrawal,
                transaction
            };
        });
        try {
            getIO().emit(`wallet_updated/${targetDriverId}`, {
                id_driver: targetDriverId,
                new_balance: Number(result.new_balance)
            });
            console.log(`📡 [SOCKET] Retiro automático acreditado e informado a 'wallet_updated/${targetDriverId}': $${result.new_balance}`);
        } catch (socketErr) {
            console.warn("⚠️ No se pudo emitir por socket:", socketErr);
        }
        return result;
    } catch (e: any) {
        if (e instanceof AppError) throw e;
        throw new AppError(`Error al procesar el retiro automático: ${e.message || e}`, 500);
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
        const result = await prisma.$transaction(async (tx) => {
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
        if (result.wallet) {
            try {
                getIO().emit(`wallet_updated/${targetDriverId}`, {
                    id_driver: targetDriverId,
                    new_balance: Number(result.wallet.balance)
                });
                console.log(`📡 [SOCKET] Transacción emitida a 'wallet_updated/${targetDriverId}': $${result.wallet.balance}`);
            } catch (socketErr) {
                console.warn("⚠️ No se pudo emitir por socket:", socketErr);
            }
        }
        return result;
    } catch (e: any) {
        if (e instanceof AppError) throw e;
        throw new AppError(`Error al agregar la transacción: ${e.message || e}`, 500);
    }
};