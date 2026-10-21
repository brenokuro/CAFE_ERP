import { BankingService } from './banking.service';
import { CreateBankAccountDto, CreateBankTransactionDto } from './dto/create-bank-account.dto';
export declare class BankingController {
    private readonly bankingService;
    constructor(bankingService: BankingService);
    createAccount(dto: CreateBankAccountDto): Promise<any>;
    findAllAccounts(): Promise<any>;
    createTransaction(dto: CreateBankTransactionDto): Promise<{
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
    }>;
    findTransactions(id: string, reconciled?: string): Promise<any>;
}
