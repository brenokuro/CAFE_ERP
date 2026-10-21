import { PrismaService } from '../../common/database/prisma.service';
import { Prisma } from '@prisma/client';
import { StockMovementQueryDto } from './dto/create-stock-movement.dto';
export declare class StockRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getClient;
    findProductById(productId: string, tenantId: string, tx?: Prisma.TransactionClient): Promise<any>;
    findMovementType(code: string, tx?: Prisma.TransactionClient): Promise<any>;
    findBatchById(batchId: string, productId: string, tenantId: string, tx?: Prisma.TransactionClient): Promise<any>;
    findBatchByCode(productId: string, batchCode: string, tenantId: string, tx?: Prisma.TransactionClient): Promise<any>;
    findActiveBatchesFifo(productId: string, tenantId: string, tx?: Prisma.TransactionClient): Promise<any>;
    createBatch(data: {
        tenantId: string;
        productId: string;
        batchCode: string;
        expirationDate: Date | null;
        quantity: Prisma.Decimal;
    }, tx?: Prisma.TransactionClient): Promise<any>;
    updateBatchQuantity(batchId: string, newQuantity: Prisma.Decimal, tx?: Prisma.TransactionClient): Promise<any>;
    updateProductStock(productId: string, newStock: Prisma.Decimal, tx?: Prisma.TransactionClient): Promise<any>;
    createStockMovement(data: any, tx?: Prisma.TransactionClient): Promise<any>;
    findMovementsPaginated(tenantId: string, filters: StockMovementQueryDto): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    findBatchesByProductId(productId: string, tenantId: string): Promise<any>;
}
