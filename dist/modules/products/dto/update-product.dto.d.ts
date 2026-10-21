import { ProductType, UnitOfMeasure } from '../../../common/enums/domain.enums';
export declare class UpdateProductDto {
    type?: ProductType;
    sku?: string;
    barcode?: string;
    name?: string;
    description?: string;
    unitOfMeasure?: UnitOfMeasure;
    unit?: string;
    isBatchControlled?: boolean;
    salePrice?: number;
    costPrice?: number;
    minStock?: number;
    ncm?: string;
    nbs?: string;
    cest?: string;
    cfopDefault?: string;
    active?: boolean;
}
