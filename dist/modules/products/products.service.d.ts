import { PrismaService } from '../../common/database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductType } from '../../common/enums/domain.enums';
import { Prisma } from '@prisma/client';
export declare class ProductsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
        salePrice: Prisma.Decimal;
        costPrice: Prisma.Decimal;
        stockQuantity: Prisma.Decimal;
        minStock: Prisma.Decimal;
        ncm: string | null;
        nbs: string | null;
        cest: string | null;
        cfopDefault: string | null;
    }>;
    findAll(params: {
        type?: ProductType;
        lowStockOnly?: boolean;
        search?: string;
    }): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateProductDto): Promise<any>;
    remove(id: string): Promise<any>;
}
