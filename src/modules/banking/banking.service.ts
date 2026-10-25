// src/modules/banking/banking.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { TenantContextService } from '../../common/multitenancy/tenant-context.service';
import {
  CreateBankAccountDto,
  CreateBankTransactionDto,
} from './dto/create-bank-account.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BankingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Criação de nova conta bancária ou caixa físico.
   */
  async createAccount(dto: CreateBankAccountDto) {
    const tenantId = TenantContextService.getTenantId();
    const centerId = TenantContextService.getCenterId();
    const initialBalance = new Prisma.Decimal(dto.initialBalance || 0);

    return this.prisma.client.bankAccount.create({
      data: {
        tenantId,
        centerId,
        name: dto.name,
        bankCode: dto.bankCode,
        bankName: dto.bankName,
        agency: dto.agency,
        accountNumber: dto.accountNumber,
        accountType: dto.accountType,
        initialBalance,
        currentBalance: initialBalance,
        active: dto.active ?? true,
      },
    });
  }

  /**
   * Lista todas as contas bancárias e caixas do Tenant.
   */
  async findAllAccounts() {
    const tenantId = TenantContextService.getTenantId();
    const centerId = TenantContextService.getCenterId();

    return this.prisma.client.bankAccount.findMany({
      where: { tenantId, centerId },
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Adiciona uma transação avulsa de extrato (ex: importação OFX/PIX).
   */
  async createTransaction(dto: CreateBankTransactionDto) {
    const tenantId = TenantContextService.getTenantId();
    const centerId = TenantContextService.getCenterId();

    const bankAccount = await this.prisma.client.bankAccount.findFirst({
      where: { id: dto.bankAccountId, tenantId, centerId },
    });

    if (!bankAccount || !bankAccount.active) {
      throw new NotFoundException('Conta bancária não encontrada ou inativa.');
    }
    if (dto.financialRecordId) {
      const record = await this.prisma.client.financialRecord.findFirst({
        where: { id: dto.financialRecordId, tenantId, centerId }, select: { id: true },
      });
      if (!record) throw new NotFoundException('Título financeiro não pertence ao centro selecionado.');
    }

    const amount = new Prisma.Decimal(dto.amount);

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.bankTransaction.create({
        data: {
          tenantId,
          centerId,
          bankAccountId: dto.bankAccountId,
          type: dto.type,
          amount,
          transactionDate: new Date(dto.transactionDate),
          description: dto.description,
          financialRecordId: dto.financialRecordId,
          externalReferenceId: dto.externalReferenceId,
          reconciled: !!dto.financialRecordId,
          reconciledAt: dto.financialRecordId ? new Date() : null,
        },
      });

      // Atualiza o saldo bancário
      const updatedBalance =
        dto.type === 'CREDIT'
          ? new Prisma.Decimal(bankAccount.currentBalance).add(amount)
          : new Prisma.Decimal(bankAccount.currentBalance).sub(amount);

      await tx.bankAccount.update({
        where: { id: bankAccount.id },
        data: { currentBalance: updatedBalance },
      });

      return transaction;
    });
  }

  /**
   * Lista transações de extrato de uma conta bancária com filtro de conciliação.
   */
  async findTransactions(bankAccountId: string, reconciled?: boolean) {
    const tenantId = TenantContextService.getTenantId();
    const centerId = TenantContextService.getCenterId();

    return this.prisma.client.bankTransaction.findMany({
      where: {
        tenantId,
        centerId,
        bankAccountId,
        ...(reconciled !== undefined ? { reconciled } : {}),
      },
      include: {
        financialRecord: { select: { id: true, description: true, type: true, dueDate: true } },
      },
      orderBy: { transactionDate: 'desc' },
    });
  }
}
