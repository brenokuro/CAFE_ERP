import { ProductType, UnitOfMeasure } from '../../../common/enums/domain.enums';
export declare class CreateProductDto {
    type: ProductType;
    sku: string;
    barcode?: string;
    name: string;
    description?: string;
    unitOfMeasure?: UnitOfMeasure;
    unit?: string;
    isBatchControlled?: boolean;
    salePrice: number;
    costPrice?: number;
    minStock?: number;
    initialStock?: number;
    initialBatchCode?: string;
    initialBatchExpiration?: string;
    ncm?: string;
    nbs?: string;
    cest?: string;
    cfopDefault?: string;
    active?: boolean;
}
