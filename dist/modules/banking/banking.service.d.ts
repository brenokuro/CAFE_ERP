import { PrismaService } from '../../common/database/prisma.service';
import { CreateBankAccountDto, CreateBankTransactionDto } from './dto/create-bank-account.dto';
import { Prisma } from '@prisma/client';
export declare class BankingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createAccount(dto: CreateBankAccountDto): Promise<any>;
    findAllAccounts(): Promise<any>;
    createTransaction(dto: CreateBankTransactionDto): Promise<{
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
    }>;
    findTransactions(bankAccountId: string, reconciled?: boolean): Promise<any>;
}
