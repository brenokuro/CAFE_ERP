import { MovementTypeCode, StockReferenceType } from '../../../common/enums/domain.enums';
export declare class CreateStockMovementDto {
    productId: string;
    product_id?: string;
    movementTypeCode: MovementTypeCode | string;
    movement_type_code?: string;
    quantity: number;
    batchId?: string;
    batch_id?: string;
    batchCode?: string;
    batch_code?: string;
    expirationDate?: string;
    expiration_date?: string;
    documentNumber?: string;
    document_number?: string;
    reason?: string;
    unitCost?: number;
    unit_cost?: number;
    referenceType?: StockReferenceType;
    referenceId?: string;
    salesOrderId?: string;
    purchaseOrderId?: string;
}
export declare class CreateManualStockMovementDto extends CreateStockMovementDto {
}
export declare class StockMovementQueryDto {
    productId?: string;
    product_id?: string;
    movementTypeCode?: string;
    movement_type_code?: string;
    userId?: string;
    user_id?: string;
    batchId?: string;
    batch_id?: string;
    documentNumber?: string;
    document_number?: string;
    startDate?: string;
    start_date?: string;
    endDate?: string;
    end_date?: string;
    page?: number;
    limit?: number;
}
export declare class StockMovementFilterDto extends StockMovementQueryDto {
}
export declare class PaginatedStockMovementResponseDto {
    data: any[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}
