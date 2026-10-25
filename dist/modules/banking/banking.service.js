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
exports.BankingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/database/prisma.service");
const tenant_context_service_1 = require("../../common/multitenancy/tenant-context.service");
const client_1 = require("@prisma/client");
let BankingService = class BankingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createAccount(dto) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const centerId = tenant_context_service_1.TenantContextService.getCenterId();
        const initialBalance = new client_1.Prisma.Decimal(dto.initialBalance || 0);
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
    async findAllAccounts() {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const centerId = tenant_context_service_1.TenantContextService.getCenterId();
        return this.prisma.client.bankAccount.findMany({
            where: { tenantId, centerId },
            include: {
                _count: { select: { transactions: true } },
            },
            orderBy: { name: 'asc' },
        });
    }
    async createTransaction(dto) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const centerId = tenant_context_service_1.TenantContextService.getCenterId();
        const bankAccount = await this.prisma.client.bankAccount.findFirst({
            where: { id: dto.bankAccountId, tenantId, centerId },
        });
        if (!bankAccount || !bankAccount.active) {
            throw new common_1.NotFoundException('Conta bancária não encontrada ou inativa.');
        }
        if (dto.financialRecordId) {
            const record = await this.prisma.client.financialRecord.findFirst({
                where: { id: dto.financialRecordId, tenantId, centerId }, select: { id: true },
            });
            if (!record)
                throw new common_1.NotFoundException('Título financeiro não pertence ao centro selecionado.');
        }
        const amount = new client_1.Prisma.Decimal(dto.amount);
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
            const updatedBalance = dto.type === 'CREDIT'
                ? new client_1.Prisma.Decimal(bankAccount.currentBalance).add(amount)
                : new client_1.Prisma.Decimal(bankAccount.currentBalance).sub(amount);
            await tx.bankAccount.update({
                where: { id: bankAccount.id },
                data: { currentBalance: updatedBalance },
            });
            return transaction;
        });
    }
    async findTransactions(bankAccountId, reconciled) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const centerId = tenant_context_service_1.TenantContextService.getCenterId();
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
};
exports.BankingService = BankingService;
exports.BankingService = BankingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BankingService);
//# sourceMappingURL=banking.service.js.map