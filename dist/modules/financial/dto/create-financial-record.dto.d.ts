import { AccountCategoryType, FinancialRecordType } from '../../../common/enums/domain.enums';
export declare class CreateChartOfAccountDto {
    code: string;
    name: string;
    type: AccountCategoryType;
    parentId?: string;
}
export declare class CreateFinancialRecordDto {
    type: FinancialRecordType;
    description: string;
    contactId?: string;
    chartOfAccountId?: string;
    dueDate: string;
    issueDate?: string;
    competencyDate?: string;
    originalAmount: number;
    installmentNumber?: number;
    totalInstallments?: number;
    salesOrderId?: string;
    purchaseOrderId?: string;
    notes?: string;
}
export declare class SettleFinancialRecordDto {
    bankAccountId: string;
    amountPaid: number;
    paymentDate: string;
    discountApplied?: number;
    fineApplied?: number;
    interestApplied?: number;
    externalReferenceId?: string;
}
