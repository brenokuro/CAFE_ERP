import { PrismaService } from '../../common/database/prisma.service';
import { CreateBankAccountDto, CreateBankTransactionDto } from './dto/create-bank-account.dto';
import { Prisma } from '@prisma/client';
export declare class BankingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
        amount: Prisma.Decimal;
        transactionDate: Date;
        reconciled: boolean;
        reconciledAt: Date | null;
        externalReferenceId: string | null;
    }>;
    findTransactions(bankAccountId: string, reconciled?: boolean): Promise<any>;
}
