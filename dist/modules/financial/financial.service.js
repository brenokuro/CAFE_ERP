"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/database/prisma.service");
const tenant_context_service_1 = require("../../common/multitenancy/tenant-context.service");
const domain_enums_1 = require("../../common/enums/domain.enums");
const client_1 = require("@prisma/client");
let FinancialService = class FinancialService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createRecord(dto) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const originalAmount = new client_1.Prisma.Decimal(dto.originalAmount);
        return this.prisma.client.financialRecord.create({
            data: {
                tenantId,
                type: dto.type,
                status: domain_enums_1.FinancialRecordStatus.PENDING,
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
    async settleRecord(recordId, dto) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        return this.prisma.$transaction(async (tx) => {
            const record = await tx.financialRecord.findFirst({
                where: { id: recordId, tenantId },
            });
            if (!record) {
                throw new common_1.NotFoundException('Título financeiro não encontrado.');
            }
            if (record.status === domain_enums_1.FinancialRecordStatus.PAID) {
                throw new common_1.BadRequestException('Este título já está totalmente quitado.');
            }
            const bankAccount = await tx.bankAccount.findFirst({
                where: { id: dto.bankAccountId, tenantId },
            });
            if (!bankAccount || !bankAccount.active) {
                throw new common_1.NotFoundException('Conta bancária informada não foi encontrada ou está inativa.');
            }
            const amountPaid = new client_1.Prisma.Decimal(dto.amountPaid);
            const discount = new client_1.Prisma.Decimal(dto.discountApplied || 0);
            const fine = new client_1.Prisma.Decimal(dto.fineApplied || 0);
            const interest = new client_1.Prisma.Decimal(dto.interestApplied || 0);
            const currentBalance = new client_1.Prisma.Decimal(record.balanceAmount);
            const maxPayable = currentBalance.add(fine).add(interest).sub(discount);
            if (amountPaid.greaterThan(maxPayable)) {
                throw new common_1.BadRequestException(`O valor informado (R$ ${amountPaid}) é superior ao saldo devedor atualizado (R$ ${maxPayable}).`);
            }
            const newPaidAmount = new client_1.Prisma.Decimal(record.paidAmount).add(amountPaid);
            const newBalance = maxPayable.sub(amountPaid);
            const newStatus = newBalance.isZero()
                ? domain_enums_1.FinancialRecordStatus.PAID
                : domain_enums_1.FinancialRecordStatus.PARTIALLY_PAID;
            const updatedRecord = await tx.financialRecord.update({
                where: { id: record.id },
                data: {
                    status: newStatus,
                    paymentDate: new Date(dto.paymentDate),
                    paidAmount: newPaidAmount,
                    balanceAmount: newBalance,
                    fineAmount: new client_1.Prisma.Decimal(record.fineAmount).add(fine),
                    interestAmount: new client_1.Prisma.Decimal(record.interestAmount).add(interest),
                    discountAmount: new client_1.Prisma.Decimal(record.discountAmount).add(discount),
                },
            });
            const txType = record.type === domain_enums_1.FinancialRecordType.RECEIVABLE
                ? domain_enums_1.BankTransactionType.CREDIT
                : domain_enums_1.BankTransactionType.DEBIT;
            const bankTx = await tx.bankTransaction.create({
                data: {
                    tenantId,
                    bankAccountId: bankAccount.id,
                    financialRecordId: record.id,
                    type: txType,
                    amount: amountPaid,
                    transactionDate: new Date(dto.paymentDate),
                    description: `Liquidação ${record.type === domain_enums_1.FinancialRecordType.RECEIVABLE ? 'Recebimento' : 'Pagamento'}: ${record.description}`,
                    reconciled: true,
                    reconciledAt: new Date(),
                    externalReferenceId: dto.externalReferenceId,
                },
            });
            const updatedAccountBalance = txType === domain_enums_1.BankTransactionType.CREDIT
                ? new client_1.Prisma.Decimal(bankAccount.currentBalance).add(amountPaid)
                : new client_1.Prisma.Decimal(bankAccount.currentBalance).sub(amountPaid);
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
    async reconcile(dto) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        return this.prisma.$transaction(async (tx) => {
            const bankTx = await tx.bankTransaction.findFirst({
                where: { id: dto.bankTransactionId, tenantId },
                include: { bankAccount: true },
            });
            if (!bankTx) {
                throw new common_1.NotFoundException('Transação bancária não encontrada.');
            }
            if (bankTx.reconciled) {
                throw new common_1.ConflictException('Esta transação bancária já se encontra conciliada.');
            }
            const record = await tx.financialRecord.findFirst({
                where: { id: dto.financialRecordId, tenantId },
            });
            if (!record) {
                throw new common_1.NotFoundException('Título financeiro não encontrado.');
            }
            if (record.status === domain_enums_1.FinancialRecordStatus.PAID) {
                throw new common_1.BadRequestException('Este título financeiro já está totalmente liquidado.');
            }
            if (record.type === domain_enums_1.FinancialRecordType.RECEIVABLE && bankTx.type !== domain_enums_1.BankTransactionType.CREDIT) {
                throw new common_1.BadRequestException('Um título a Receber só pode ser conciliado com uma transação bancária de CRÉDITO (entrada).');
            }
            if (record.type === domain_enums_1.FinancialRecordType.PAYABLE && bankTx.type !== domain_enums_1.BankTransactionType.DEBIT) {
                throw new common_1.BadRequestException('Um título a Pagar só pode ser conciliado com uma transação bancária de DÉBITO (saída).');
            }
            const txAmount = new client_1.Prisma.Decimal(bankTx.amount);
            const recordBalance = new client_1.Prisma.Decimal(record.balanceAmount);
            const amortizedAmount = txAmount.greaterThan(recordBalance) ? recordBalance : txAmount;
            const newPaidAmount = new client_1.Prisma.Decimal(record.paidAmount).add(amortizedAmount);
            const newBalance = recordBalance.sub(amortizedAmount);
            const newStatus = newBalance.isZero()
                ? domain_enums_1.FinancialRecordStatus.PAID
                : domain_enums_1.FinancialRecordStatus.PARTIALLY_PAID;
            const updatedRecord = await tx.financialRecord.update({
                where: { id: record.id },
                data: {
                    status: newStatus,
                    paidAmount: newPaidAmount,
                    balanceAmount: newBalance,
                    paymentDate: bankTx.transactionDate,
                },
            });
            const updatedTx = await tx.bankTransaction.update({
                where: { id: bankTx.id },
                data: {
                    financialRecordId: record.id,
                    reconciled: true,
                    reconciledAt: new Date(),
                },
            });
            const newBalanceAccount = bankTx.type === domain_enums_1.BankTransactionType.CREDIT
                ? new client_1.Prisma.Decimal(bankTx.bankAccount.currentBalance).add(txAmount)
                : new client_1.Prisma.Decimal(bankTx.bankAccount.currentBalance).sub(txAmount);
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
    async getCashFlow(params) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const today = new Date();
        const start = params?.startDate ? new Date(params.startDate) : new Date(today.getFullYear(), today.getMonth(), 1);
        const end = params?.endDate ? new Date(params.endDate) : new Date(today.getFullYear(), today.getMonth() + 2, 0);
        const bankAccounts = await this.prisma.client.bankAccount.findMany({
            where: { tenantId, active: true },
        });
        const currentAvailableBalance = bankAccounts.reduce((acc, accItem) => acc.add(new client_1.Prisma.Decimal(accItem.currentBalance)), new client_1.Prisma.Decimal(0));
        const records = await this.prisma.client.financialRecord.findMany({
            where: {
                tenantId,
                dueDate: {
                    gte: start,
                    lte: end,
                },
                status: { not: domain_enums_1.FinancialRecordStatus.CANCELLED },
            },
            include: {
                contact: { select: { name: true } },
                chartOfAccount: { select: { name: true } },
            },
            orderBy: { dueDate: 'asc' },
        });
        let totalProjectedReceivables = new client_1.Prisma.Decimal(0);
        let totalProjectedPayables = new client_1.Prisma.Decimal(0);
        let totalRealizedRevenues = new client_1.Prisma.Decimal(0);
        let totalRealizedExpenses = new client_1.Prisma.Decimal(0);
        const dailyMap = new Map();
        for (const record of records) {
            const dateKey = record.dueDate.toISOString().split('T')[0];
            if (!dailyMap.has(dateKey)) {
                dailyMap.set(dateKey, {
                    date: dateKey,
                    inflow: new client_1.Prisma.Decimal(0),
                    outflow: new client_1.Prisma.Decimal(0),
                });
            }
            const daySummary = dailyMap.get(dateKey);
            if (record.type === domain_enums_1.FinancialRecordType.RECEIVABLE) {
                totalRealizedRevenues = totalRealizedRevenues.add(new client_1.Prisma.Decimal(record.paidAmount));
                totalProjectedReceivables = totalProjectedReceivables.add(new client_1.Prisma.Decimal(record.balanceAmount));
                daySummary.inflow = daySummary.inflow.add(new client_1.Prisma.Decimal(record.balanceAmount));
            }
            else {
                totalRealizedExpenses = totalRealizedExpenses.add(new client_1.Prisma.Decimal(record.paidAmount));
                totalProjectedPayables = totalProjectedPayables.add(new client_1.Prisma.Decimal(record.balanceAmount));
                daySummary.outflow = daySummary.outflow.add(new client_1.Prisma.Decimal(record.balanceAmount));
            }
        }
        const netProjected = totalProjectedReceivables.sub(totalProjectedPayables);
        const finalProjectedBalance = currentAvailableBalance.add(netProjected);
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
            bankAccounts: bankAccounts.map((acc) => ({
                id: acc.id,
                name: acc.name,
                accountType: acc.accountType,
                balance: Number(acc.currentBalance),
            })),
            dailyTimeline: dailyBreakdown,
        };
    }
    async findAllRecords(params) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const where = {
            tenantId,
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
    async findOneRecord(id) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const record = await this.prisma.client.financialRecord.findFirst({
            where: { id, tenantId },
            include: {
                contact: true,
                chartOfAccount: true,
                salesOrder: true,
                purchaseOrder: true,
                bankTransactions: true,
            },
        });
        if (!record) {
            throw new common_1.NotFoundException(`Título financeiro com ID ${id} não encontrado.`);
        }
        return record;
    }
};
exports.FinancialService = FinancialService;
exports.FinancialService = FinancialService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinancialService);
//# sourceMappingURL=financial.service.js.map