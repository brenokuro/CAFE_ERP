import { BankingService } from './banking.service';
import { CreateBankAccountDto, CreateBankTransactionDto } from './dto/create-bank-account.dto';
export declare class BankingController {
    private readonly bankingService;
    constructor(bankingService: BankingService);
    createAccount(dto: CreateBankAccountDto): Promise<any>;
    findAllAccounts(): Promise<any>;
    createTransaction(dto: CreateBankTransactionDto): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.BankTransactionType;
        amount: import("@prisma/client/runtime/library").Decimal;
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
    }>;
    findTransactions(id: string, reconciled?: string): Promise<any>;
}
