import { PrismaService } from '../../common/database/prisma.service';
import { StockRepository } from './stock.repository';
import { CreateStockMovementDto, StockMovementQueryDto } from './dto/create-stock-movement.dto';
import { CreateProductBatchDto, ProductBatchResponseDto } from './dto/create-batch.dto';
export declare class StockService {
    private readonly prisma;
    private readonly stockRepository;
    constructor(prisma: PrismaService, stockRepository: StockRepository);
    createMovement(dto: CreateStockMovementDto): Promise<any>;
    createManualMovement(dto: CreateStockMovementDto): Promise<any>;
    getMovements(filters: StockMovementQueryDto): Promise<{
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
    createBatch(dto: CreateProductBatchDto): Promise<any>;
    getProductBatches(productId: string): Promise<ProductBatchResponseDto[]>;
}
