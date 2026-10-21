import { FinancialService } from './financial.service';
import { CreateFinancialRecordDto, SettleFinancialRecordDto } from './dto/create-financial-record.dto';
import { ReconcileTransactionDto } from '../banking/dto/create-bank-account.dto';
import { FinancialRecordStatus, FinancialRecordType } from '../../common/enums/domain.enums';
export declare class FinancialController {
    private readonly financialService;
    constructor(financialService: FinancialService);
    getCashFlow(startDate?: string, endDate?: string): Promise<{
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
    reconcile(dto: ReconcileTransactionDto): Promise<{
        message: string;
        reconciledTransaction: {
            tenantId: string;
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.BankTransactionType;
            description: string;
            bankAccountId: string;
            financialRecordId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            transactionDate: Date;
            reconciled: boolean;
            reconciledAt: Date | null;
            externalReferenceId: string | null;
        };
        updatedFinancialRecord: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            type: import(".prisma/client").$Enums.FinancialRecordType;
            description: string;
            status: import(".prisma/client").$Enums.FinancialRecordStatus;
            issueDate: Date;
            salesOrderId: string | null;
            purchaseOrderId: string | null;
            contactId: string | null;
            chartOfAccountId: string | null;
            dueDate: Date;
            competencyDate: Date;
            paymentDate: Date | null;
            originalAmount: import("@prisma/client/runtime/library").Decimal;
            discountAmount: import("@prisma/client/runtime/library").Decimal;
            fineAmount: import("@prisma/client/runtime/library").Decimal;
            interestAmount: import("@prisma/client/runtime/library").Decimal;
            paidAmount: import("@prisma/client/runtime/library").Decimal;
            balanceAmount: import("@prisma/client/runtime/library").Decimal;
            installmentNumber: number;
            totalInstallments: number;
        };
        newAccountBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
    createRecord(dto: CreateFinancialRecordDto): Promise<any>;
    settleRecord(id: string, dto: SettleFinancialRecordDto): Promise<{
        financialRecord: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            type: import(".prisma/client").$Enums.FinancialRecordType;
            description: string;
            status: import(".prisma/client").$Enums.FinancialRecordStatus;
            issueDate: Date;
            salesOrderId: string | null;
            purchaseOrderId: string | null;
            contactId: string | null;
            chartOfAccountId: string | null;
            dueDate: Date;
            competencyDate: Date;
            paymentDate: Date | null;
            originalAmount: import("@prisma/client/runtime/library").Decimal;
            discountAmount: import("@prisma/client/runtime/library").Decimal;
            fineAmount: import("@prisma/client/runtime/library").Decimal;
            interestAmount: import("@prisma/client/runtime/library").Decimal;
            paidAmount: import("@prisma/client/runtime/library").Decimal;
            balanceAmount: import("@prisma/client/runtime/library").Decimal;
            installmentNumber: number;
            totalInstallments: number;
        };
        bankTransaction: {
            tenantId: string;
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.BankTransactionType;
            description: string;
            bankAccountId: string;
            financialRecordId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            transactionDate: Date;
            reconciled: boolean;
            reconciledAt: Date | null;
            externalReferenceId: string | null;
        };
        newAccountBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
    findAllRecords(type?: FinancialRecordType, status?: FinancialRecordStatus, contactId?: string, startDate?: string, endDate?: string): Promise<any>;
    findOneRecord(id: string): Promise<any>;
}
