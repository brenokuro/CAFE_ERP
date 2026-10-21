import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductType } from '../../common/enums/domain.enums';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(dto: CreateProductDto): Promise<{
        tenantId: string;
        id: string;
        name: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ProductType;
        sku: string;
        barcode: string | null;
        description: string | null;
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
