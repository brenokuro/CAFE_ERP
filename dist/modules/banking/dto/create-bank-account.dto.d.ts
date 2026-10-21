import { BankAccountType, BankTransactionType } from '../../../common/enums/domain.enums';
export declare class CreateBankAccountDto {
    name: string;
    bankCode?: string;
    bankName?: string;
    agency?: string;
    accountNumber?: string;
    accountType: BankAccountType;
    initialBalance?: number;
    active?: boolean;
}
export declare class CreateBankTransactionDto {
    bankAccountId: string;
    type: BankTransactionType;
    amount: number;
    transactionDate: string;
    description: string;
    financialRecordId?: string;
    externalReferenceId?: string;
}
export declare class ReconcileTransactionDto {
    bankTransactionId: string;
    financialRecordId: string;
}
