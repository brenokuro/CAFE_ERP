export declare class CreateProductBatchDto {
    productId: string;
    product_id?: string;
    batchCode: string;
    batch_code?: string;
    expirationDate?: string;
    expiration_date?: string;
    initialQuantity?: number;
    initial_quantity?: number;
}
export type BatchExpirationStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'NO_EXPIRY';
export declare class ProductBatchResponseDto {
    id: string;
    tenantId: string;
    productId: string;
    batchCode: string;
    expirationDate: Date | null;
    quantity: number;
    daysUntilExpiration?: number | null;
    status?: BatchExpirationStatus;
    createdAt: Date;
    updatedAt: Date;
}
