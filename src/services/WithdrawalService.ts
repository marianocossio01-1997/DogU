import { PrismaClient, WithdrawalStatus } from '@prisma/client';

const prisma = new PrismaClient();
export class WithdrawalService {
  static async updateBankDetails(
    id_driver: number,
    data: {
      bank_name: string;
      cbu_cvu?: string | undefined;
      alias?: string | undefined;
      account_holder_name: string;
      tax_id: string;
    }
  ) {
    return await prisma.driverWallet.upsert({
      where: { id_driver },
      update: {
        bank_name: data.bank_name,
        cbu_cvu: data.cbu_cvu || null,
        alias: data.alias || null,
        account_holder_name: data.account_holder_name,
        tax_id: data.tax_id,
      },
      create: {
        id_driver,
        balance: 0.0,
        bank_name: data.bank_name,
        cbu_cvu: data.cbu_cvu || null,
        alias: data.alias || null,
        account_holder_name: data.account_holder_name,
        tax_id: data.tax_id,
      },
    });
  }
  static async requestWithdrawal(id_driver: number, amount: number, notes?: string) {
    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.driverWallet.findUnique({
        where: { id_driver },
      });

      if (!wallet) {
        throw new Error('No se encontró la billetera del conductor.');
      }
      if (!wallet.cbu_cvu && !wallet.alias) {
        throw new Error('Debes asociar una cuenta bancaria o CBU/CVU/Alias antes de solicitar un retiro.');
      }
      if (wallet.balance < amount) {
        throw new Error(`Saldo insuficiente. Tu saldo actual es de $${wallet.balance}`);
      }

      const updatedWallet = await tx.driverWallet.update({
        where: { id_driver },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });
      await tx.walletTransaction.create({
        data: {
          id_driver_wallet: id_driver,
          amount,
          type: 'WITHDRAWAL',
          description: `Solicitud de retiro enviada`,
        },
      });
      const withdrawal = await tx.withdrawalRequest.create({
        data: {
          id_driver_wallet: id_driver,
          amount,
          status: WithdrawalStatus.PENDING,
          notes: notes ?? null,
        },
      });

      return { withdrawal, new_balance: updatedWallet.balance };
    });
  }
  static async getDriverWithdrawals(id_driver: number) {
    return await prisma.withdrawalRequest.findMany({
      where: { id_driver_wallet: id_driver },
      orderBy: { created_at: 'desc' },
    });
  }
}