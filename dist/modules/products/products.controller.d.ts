import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductType } from '../../common/enums/domain.enums';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(dto: CreateProductDto): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.ProductType;
        description: string | null;
        createdAt: Date;
        tenantId: string;
        name: string;
        active: boolean;
        updatedAt: Date;
        sku: string;
        barcode: string | null;
        unitOfMeasure: import(".prisma/client").$Enums.UnitOfMeasure;
        unit: string | null;
        isBatchControlled: boolean;
        salePrice: import("@prisma/client/runtime/library").Decimal;
        costPrice: import("@prisma/client/runtime/library").Decimal;
        stockQuantity: import("@prisma/client/runtime/library").Decimal;
        minStock: import("@prisma/client/runtime/library").Decimal;
        ncm: string | null;
        nbs: string | null;
        cest: string | null;
        cfopDefault: string | null;
    }>;
    findAll(type?: ProductType, lowStockOnly?: string, search?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateProductDto): Promise<any>;
    remove(id: string): Promise<any>;
}
