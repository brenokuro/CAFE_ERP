// src/modules/financial/financial.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { TenantContextService } from '../../common/multitenancy/tenant-context.service';
import {
  CreateFinancialRecordDto,
  SettleFinancialRecordDto,
} from './dto/create-financial-record.dto';
import { ReconcileTransactionDto } from '../banking/dto/create-bank-account.dto';
import {
  BankTransactionType,
  FinancialRecordStatus,
  FinancialRecordType,
} from '../../common/enums/domain.enums';
import { Prisma } from '@prisma/client';

@Injectable()
export class FinancialService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Criação de título financeiro avulso (Conta a Pagar ou Conta a Receber).
   */
  async createRecord(dto: CreateFinancialRecordDto) {
    const tenantId = TenantContextService.getTenantId();
    const centerId = TenantContextService.getCenterId();
    if (dto.salesOrderId) {
      const order = await this.prisma.client.salesOrder.findFirst({ where: { id: dto.salesOrderId, tenantId, centerId } });
      if (!order) throw new NotFoundException('Venda não pertence ao centro selecionado.');
    }
    if (dto.purchaseOrderId) {
      const order = await this.prisma.client.purchaseOrder.findFirst({ where: { id: dto.purchaseOrderId, tenantId, centerId } });
      if (!order) throw new NotFoundException('Compra não pertence ao centro selecionado.');
    }

    const originalAmount = new Prisma.Decimal(dto.originalAmount);

    return this.prisma.client.financialRecord.create({
      data: {
        tenantId,
        centerId,
        type: dto.type,
        status: FinancialRecordStatus.PENDING,
        description: dto.description,
        contactId: dto.contactId,
        chartOfAccountId: dto.chartOfAccountId,
        dueDate: new Date(dto.dueDate),
        issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
        competencyDate: dto.competencyDate ? new Date(dto.competencyDate) : new Date(),
        originalAmount,
        balanceAmount: originalAmount,
        installmentNumber: dto.installmentNumber || 1,
        totalInstallments: dto.totalInstallments || 1,
        salesOrderId: dto.salesOrderId,
        purchaseOrderId: dto.purchaseOrderId,
        notes: dto.notes,
      },
      include: {
        contact: { select: { id: true, name: true, document: true } },
        chartOfAccount: { select: { id: true, code: true, name: true } },
      },
    });
  }

  /**
   * FLUXO ESSENCIAL: Baixa Manual de Título (Contas a Pagar/Receber)
   * Executa atomicamente:
   * 1. Valida saldo em aberto e aplica juros, multa e descontos.
   * 2. Atualiza o status do título para PAID ou PARTIALLY_PAID.
   * 3. Registra movimentação bancária correspondente (BankTransaction).
   * 4. Atualiza o saldo em tempo real da BankAccount.
   */
  async settleRecord(recordId: string, dto: SettleFinancialRecordDto) {
    const tenantId = TenantContextService.getTenantId();
    const centerId = TenantContextService.getCenterId();

    return this.prisma.$transaction(async (tx) => {
      const record = await tx.financialRecord.findFirst({
        where: { id: recordId, tenantId, centerId },
      });

      if (!record) {
        throw new NotFoundException('Título financeiro não encontrado.');
      }

      if (record.status === FinancialRecordStatus.PAID) {
        throw new BadRequestException('Este título já está totalmente quitado.');
      }

      const bankAccount = await tx.bankAccount.findFirst({
        where: { id: dto.bankAccountId, tenantId, centerId },
      });

      if (!bankAccount || !bankAccount.active) {
        throw new NotFoundException('Conta bancária informada não foi encontrada ou está inativa.');
      }

      const amountPaid = new Prisma.Decimal(dto.amountPaid);
      const discount = new Prisma.Decimal(dto.discountApplied || 0);
      const fine = new Prisma.Decimal(dto.fineApplied || 0);
      const interest = new Prisma.Decimal(dto.interestApplied || 0);

      const currentBalance = new Prisma.Decimal(record.balanceAmount);
      const maxPayable = currentBalance.add(fine).add(interest).sub(discount);

      if (amountPaid.greaterThan(maxPayable)) {
        throw new BadRequestException(
          `O valor informado (R$ ${amountPaid}) é superior ao saldo devedor atualizado (R$ ${maxPayable}).`,
        );
      }

      const newPaidAmount = new Prisma.Decimal(record.paidAmount).add(amountPaid);
      const newBalance = maxPayable.sub(amountPaid);
      const newStatus = newBalance.isZero()
        ? FinancialRecordStatus.PAID
        : FinancialRecordStatus.PARTIALLY_PAID;

      // 1. Atualiza o título financeiro
      const updatedRecord = await tx.financialRecord.update({
        where: { id: record.id },
        data: {
          status: newStatus,
          paymentDate: new Date(dto.paymentDate),
          paidAmount: newPaidAmount,
          balanceAmount: newBalance,
          fineAmount: new Prisma.Decimal(record.fineAmount).add(fine),
          interestAmount: new Prisma.Decimal(record.interestAmount).add(interest),
          discountAmount: new Prisma.Decimal(record.discountAmount).add(discount),
        },
      });

      // 2. Cria transação bancária no extrato
      const txType =
        record.type === FinancialRecordType.RECEIVABLE
          ? BankTransactionType.CREDIT
          : BankTransactionType.DEBIT;

      const bankTx = await tx.bankTransaction.create({
        data: {
          tenantId,
          centerId,
          bankAccountId: bankAccount.id,
          financialRecordId: record.id,
          type: txType,
          amount: amountPaid,
          transactionDate: new Date(dto.paymentDate),
          description: `Liquidação ${record.type === FinancialRecordType.RECEIVABLE ? 'Recebimento' : 'Pagamento'}: ${record.description}`,
          reconciled: true,
          reconciledAt: new Date(),
          externalReferenceId: dto.externalReferenceId,
        },
      });

      // 3. Atualiza o saldo bancário
      const updatedAccountBalance =
        txType === BankTransactionType.CREDIT
          ? new Prisma.Decimal(bankAccount.currentBalance).add(amountPaid)
          : new Prisma.Decimal(bankAccount.currentBalance).sub(amountPaid);

      await tx.bankAccount.update({
        where: { id: bankAccount.id },
        data: { currentBalance: updatedAccountBalance },
      });

      return {
        financialRecord: updatedRecord,
        bankTransaction: bankTx,
        newAccountBalance: updatedAccountBalance,
      };
    });
  }

  /**
   * FLUXO ESSENCIAL: Conciliação Bancária
   * POST /financial/reconcile
   * Vincula uma transação bancária (importada via OFX ou PIX) a um título financeiro:
   * 1. Valida compatibilidade de tipo (RECEIVABLE requer CREDIT, PAYABLE requer DEBIT).
   * 2. Dá baixa ou amortiza o título financeiro.
   * 3. Atualiza status para conciliado (reconciled: true).
   * 4. Ajusta o saldo da conta bancária.
   */
  async reconcile(dto: ReconcileTransactionDto) {
    const tenantId = TenantContextService.getTenantId();
    const centerId = TenantContextService.getCenterId();

    return this.prisma.$transaction(async (tx) => {
      // 1. Busca transação bancária
      const bankTx = await tx.bankTransaction.findFirst({
        where: { id: dto.bankTransactionId, tenantId, centerId },
        include: { bankAccount: true },
      });

      if (!bankTx) {
        throw new NotFoundException('Transação bancária não encontrada.');
      }

      if (bankTx.reconciled) {
        throw new ConflictException('Esta transação bancária já se encontra conciliada.');
      }

      // 2. Busca título financeiro
      const record = await tx.financialRecord.findFirst({
        where: { id: dto.financialRecordId, tenantId, centerId },
      });

      if (!record) {
        throw new NotFoundException('Título financeiro não encontrado.');
      }

      if (record.status === FinancialRecordStatus.PAID) {
        throw new BadRequestException('Este título financeiro já está totalmente liquidado.');
      }

      // 3. Validação de compatibilidade financeira
      if (record.type === FinancialRecordType.RECEIVABLE && bankTx.type !== BankTransactionType.CREDIT) {
        throw new BadRequestException(
          'Um título a Receber só pode ser conciliado com uma transação bancária de CRÉDITO (entrada).',
        );
      }

      if (record.type === FinancialRecordType.PAYABLE && bankTx.type !== BankTransactionType.DEBIT) {
        throw new BadRequestException(
          'Um título a Pagar só pode ser conciliado com uma transação bancária de DÉBITO (saída).',
        );
      }

      const txAmount = new Prisma.Decimal(bankTx.amount);
      const recordBalance = new Prisma.Decimal(record.balanceAmount);

      const amortizedAmount = txAmount.greaterThan(recordBalance) ? recordBalance : txAmount;
      const newPaidAmount = new Prisma.Decimal(record.paidAmount).add(amortizedAmount);
      const newBalance = recordBalance.sub(amortizedAmount);
      const newStatus = newBalance.isZero()
        ? FinancialRecordStatus.PAID
        : FinancialRecordStatus.PARTIALLY_PAID;

      // 4. Atualiza o título financeiro
      const updatedRecord = await tx.financialRecord.update({
        where: { id: record.id },
        data: {
          status: newStatus,
          paidAmount: newPaidAmount,
          balanceAmount: newBalance,
          paymentDate: bankTx.transactionDate,
        },
      });

      // 5. Marca a transação bancária como conciliada
      const updatedTx = await tx.bankTransaction.update({
        where: { id: bankTx.id },
        data: {
          financialRecordId: record.id,
          reconciled: true,
          reconciledAt: new Date(),
        },
      });

      // 6. Atualiza o saldo da conta corrente
      const newBalanceAccount =
        bankTx.type === BankTransactionType.CREDIT
          ? new Prisma.Decimal(bankTx.bankAccount.currentBalance).add(txAmount)
          : new Prisma.Decimal(bankTx.bankAccount.currentBalance).sub(txAmount);

      await tx.bankAccount.update({
        where: { id: bankTx.bankAccountId },
        data: { currentBalance: newBalanceAccount },
      });

      return {
        message: 'Transação bancária e título financeiro conciliados com sucesso.',
        reconciledTransaction: updatedTx,
        updatedFinancialRecord: updatedRecord,
        newAccountBalance: newBalanceAccount,
      };
    });
  }

  /**
   * FLUXO ESSENCIAL: Fluxo de Caixa Consolidado e Projetado
   * GET /financial/cash-flow
   * Retorna:
   * - Saldo consolidado disponível nas contas bancárias
   * - Receitas realizadas vs Despesas realizadas
   * - Projeção de recebimentos futuros vs pagamentos futuros
   * - Saldo projetado no final do período
   * - Detalhamento cronológico dia a dia
   */
  async getCashFlow(params?: { startDate?: string; endDate?: string }) {
    const tenantId = TenantContextService.getTenantId();
    const centerId = TenantContextService.getCenterId();

    const today = new Date();
    const start = params?.startDate ? new Date(params.startDate) : new Date(today.getFullYear(), today.getMonth(), 1);
    const end = params?.endDate ? new Date(params.endDate) : new Date(today.getFullYear(), today.getMonth() + 2, 0);

    // 1. Saldo atual disponível somando todas as contas bancárias e caixas
    const bankAccounts = await this.prisma.client.bankAccount.findMany({
      where: { tenantId, centerId, active: true },
    });

    const currentAvailableBalance = bankAccounts.reduce(
      (acc: Prisma.Decimal, accItem: any) => acc.add(new Prisma.Decimal(accItem.currentBalance)),
      new Prisma.Decimal(0),
    );

    // 2. Títulos no período
    const records = await this.prisma.client.financialRecord.findMany({
      where: {
        tenantId,
        centerId,
        dueDate: {
          gte: start,
          lte: end,
        },
        status: { not: FinancialRecordStatus.CANCELLED },
      },
      include: {
        contact: { select: { name: true } },
        chartOfAccount: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    let totalProjectedReceivables = new Prisma.Decimal(0);
    let totalProjectedPayables = new Prisma.Decimal(0);
    let totalRealizedRevenues = new Prisma.Decimal(0);
    let totalRealizedExpenses = new Prisma.Decimal(0);

    const dailyMap = new Map<string, { date: string; inflow: Prisma.Decimal; outflow: Prisma.Decimal }>();

    for (const record of records) {
      const dateKey = record.dueDate.toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: dateKey,
          inflow: new Prisma.Decimal(0),
          outflow: new Prisma.Decimal(0),
        });
      }

      const daySummary = dailyMap.get(dateKey)!;

      if (record.type === FinancialRecordType.RECEIVABLE) {
        totalRealizedRevenues = totalRealizedRevenues.add(new Prisma.Decimal(record.paidAmount));
        totalProjectedReceivables = totalProjectedReceivables.add(new Prisma.Decimal(record.balanceAmount));
        daySummary.inflow = daySummary.inflow.add(new Prisma.Decimal(record.balanceAmount));
      } else {
        totalRealizedExpenses = totalRealizedExpenses.add(new Prisma.Decimal(record.paidAmount));
        totalProjectedPayables = totalProjectedPayables.add(new Prisma.Decimal(record.balanceAmount));
        daySummary.outflow = daySummary.outflow.add(new Prisma.Decimal(record.balanceAmount));
      }
    }

    const netProjected = totalProjectedReceivables.sub(totalProjectedPayables);
    const finalProjectedBalance = currentAvailableBalance.add(netProjected);

    // Constrói linha do tempo com saldo acumulado
    let runningBalance = currentAvailableBalance;
    const dailyBreakdown = Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => {
        const netDaily = item.inflow.sub(item.outflow);
        runningBalance = runningBalance.add(netDaily);
        return {
          date: item.date,
          expectedInflow: item.inflow.toNumber(),
          expectedOutflow: item.outflow.toNumber(),
          netDaily: netDaily.toNumber(),
          projectedRunningBalance: runningBalance.toNumber(),
        };
      });

    return {
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
      summary: {
        currentAvailableBalance: currentAvailableBalance.toNumber(),
        totalRealizedRevenues: totalRealizedRevenues.toNumber(),
        totalRealizedExpenses: totalRealizedExpenses.toNumber(),
        totalProjectedReceivables: totalProjectedReceivables.toNumber(),
        totalProjectedPayables: totalProjectedPayables.toNumber(),
        netProjectedFlow: netProjected.toNumber(),
        finalProjectedBalance: finalProjectedBalance.toNumber(),
      },
      bankAccounts: bankAccounts.map((acc: any) => ({
        id: acc.id,
        name: acc.name,
        accountType: acc.accountType,
        balance: Number(acc.currentBalance),
      })),
      dailyTimeline: dailyBreakdown,
    };
  }

  /**
   * Listagem de Títulos Financeiros com filtros flexíveis.
   */
  async findAllRecords(params: {
    type?: FinancialRecordType;
    status?: FinancialRecordStatus;
    contactId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const tenantId = TenantContextService.getTenantId();
    const centerId = TenantContextService.getCenterId();

    const where: Prisma.FinancialRecordWhereInput = {
      tenantId,
      centerId,
      ...(params.type ? { type: params.type } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.contactId ? { contactId: params.contactId } : {}),
      ...(params.startDate || params.endDate
        ? {
            dueDate: {
              ...(params.startDate ? { gte: new Date(params.startDate) } : {}),
              ...(params.endDate ? { lte: new Date(params.endDate) } : {}),
            },
          }
        : {}),
    };

    return this.prisma.client.financialRecord.findMany({
      where,
      include: {
        contact: { select: { id: true, name: true, document: true } },
        chartOfAccount: { select: { id: true, code: true, name: true } },
        bankTransactions: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  /**
   * Busca detalhes de um título financeiro pelo ID.
   */
  async findOneRecord(id: string) {
    const tenantId = TenantContextService.getTenantId();
    const centerId = TenantContextService.getCenterId();

    const record = await this.prisma.client.financialRecord.findFirst({
      where: { id, tenantId, centerId },
      include: {
        contact: true,
        chartOfAccount: true,
        salesOrder: true,
        purchaseOrder: true,
        bankTransactions: true,
      },
    });

    if (!record) {
      throw new NotFoundException(`Título financeiro com ID ${id} não encontrado.`);
    }

    return record;
  }
}
