import { PrismaService } from '../../common/database/prisma.service';
import { CreateFinancialRecordDto, SettleFinancialRecordDto } from './dto/create-financial-record.dto';
import { ReconcileTransactionDto } from '../banking/dto/create-bank-account.dto';
import { FinancialRecordStatus, FinancialRecordType } from '../../common/enums/domain.enums';
import { Prisma } from '@prisma/client';
export declare class FinancialService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createRecord(dto: CreateFinancialRecordDto): Promise<any>;
    settleRecord(recordId: string, dto: SettleFinancialRecordDto): Promise<{
        financialRecord: {
            id: string;
            type: import(".prisma/client").$Enums.FinancialRecordType;
            description: string;
            createdAt: Date;
            tenantId: string;
            centerId: string | null;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.FinancialRecordStatus;
            issueDate: Date;
            notes: string | null;
            salesOrderId: string | null;
            purchaseOrderId: string | null;
            contactId: string | null;
            chartOfAccountId: string | null;
            dueDate: Date;
            competencyDate: Date;
            paymentDate: Date | null;
            originalAmount: Prisma.Decimal;
            discountAmount: Prisma.Decimal;
            fineAmount: Prisma.Decimal;
            interestAmount: Prisma.Decimal;
            paidAmount: Prisma.Decimal;
            balanceAmount: Prisma.Decimal;
            installmentNumber: number;
            totalInstallments: number;
        };
        bankTransaction: {
            id: string;
            type: import(".prisma/client").$Enums.BankTransactionType;
            amount: Prisma.Decimal;
            transactionDate: Date;
            description: string;
            reconciled: boolean;
            reconciledAt: Date | null;
            externalReferenceId: string | null;
            createdAt: Date;
            tenantId: string;
            centerId: string | null;
            bankAccountId: string;
            financialRecordId: string | null;
        };
        newAccountBalance: Prisma.Decimal;
    }>;
    reconcile(dto: ReconcileTransactionDto): Promise<{
        message: string;
        reconciledTransaction: {
            id: string;
            type: import(".prisma/client").$Enums.BankTransactionType;
            amount: Prisma.Decimal;
            transactionDate: Date;
            description: string;
            reconciled: boolean;
            reconciledAt: Date | null;
            externalReferenceId: string | null;
            createdAt: Date;
            tenantId: string;
            centerId: string | null;
            bankAccountId: string;
            financialRecordId: string | null;
        };
        updatedFinancialRecord: {
            id: string;
            type: import(".prisma/client").$Enums.FinancialRecordType;
            description: string;
            createdAt: Date;
            tenantId: string;
            centerId: string | null;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.FinancialRecordStatus;
            issueDate: Date;
            notes: string | null;
            salesOrderId: string | null;
            purchaseOrderId: string | null;
            contactId: string | null;
            chartOfAccountId: string | null;
            dueDate: Date;
            competencyDate: Date;
            paymentDate: Date | null;
            originalAmount: Prisma.Decimal;
            discountAmount: Prisma.Decimal;
            fineAmount: Prisma.Decimal;
            interestAmount: Prisma.Decimal;
            paidAmount: Prisma.Decimal;
            balanceAmount: Prisma.Decimal;
            installmentNumber: number;
            totalInstallments: number;
        };
        newAccountBalance: Prisma.Decimal;
    }>;
    getCashFlow(params?: {
        startDate?: string;
        endDate?: string;
    }): Promise<{
        period: {
            startDate: string;
            endDate: string;
        };
        summary: {
            currentAvailableBalance: any;
            totalRealizedRevenues: number;
            totalRealizedExpenses: number;
            totalProjectedReceivables: number;
            totalProjectedPayables: number;
            netProjectedFlow: number;
            finalProjectedBalance: any;
        };
        bankAccounts: any;
        dailyTimeline: {
            date: string;
            expectedInflow: number;
            expectedOutflow: number;
            netDaily: number;
            projectedRunningBalance: any;
        }[];
    }>;
    findAllRecords(params: {
        type?: FinancialRecordType;
        status?: FinancialRecordStatus;
        contactId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<any>;
    findOneRecord(id: string): Promise<any>;
}
