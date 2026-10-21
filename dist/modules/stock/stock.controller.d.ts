import { StockService } from './stock.service';
import { CreateStockMovementDto, StockMovementQueryDto } from './dto/create-stock-movement.dto';
import { CreateProductBatchDto } from './dto/create-batch.dto';
export declare class StockController {
    private readonly stockService;
    constructor(stockService: StockService);
    createMovement(dto: CreateStockMovementDto): Promise<any>;
    createManualAdjustment(dto: CreateStockMovementDto): Promise<any>;
    getMovements(query: StockMovementQueryDto): Promise<{
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
    getProductBatches(productId: string): Promise<import("./dto/create-batch.dto").ProductBatchResponseDto[]>;
    createBatch(dto: CreateProductBatchDto): Promise<any>;
}
