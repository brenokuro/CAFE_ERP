"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/database/prisma.service");
const tenant_context_service_1 = require("../../common/multitenancy/tenant-context.service");
const domain_enums_1 = require("../../common/enums/domain.enums");
const client_1 = require("@prisma/client");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const userId = tenant_context_service_1.TenantContextService.getUserId();
        const centerId = tenant_context_service_1.TenantContextService.getCenterId();
        const existingSku = await this.prisma.client.product.findFirst({
            where: { tenantId, sku: dto.sku },
        });
        if (existingSku) {
            throw new common_1.ConflictException(`Já existe um produto com o SKU "${dto.sku}" nesta empresa.`);
        }
        return this.prisma.$transaction(async (tx) => {
            const initialStock = new client_1.Prisma.Decimal(dto.initialStock || 0);
            const salePrice = new client_1.Prisma.Decimal(dto.salePrice);
            const costPrice = new client_1.Prisma.Decimal(dto.costPrice || 0);
            const minStock = new client_1.Prisma.Decimal(dto.minStock || 0);
            const product = await tx.product.create({
                data: {
                    tenantId,
                    type: dto.type,
                    sku: dto.sku,
                    barcode: dto.barcode,
                    name: dto.name,
                    description: dto.description,
                    unitOfMeasure: dto.unitOfMeasure || domain_enums_1.UnitOfMeasure.UN,
                    unit: dto.unit || dto.unitOfMeasure || 'UN',
                    isBatchControlled: dto.isBatchControlled ?? false,
                    salePrice,
                    costPrice,
                    stockQuantity: initialStock,
                    minStock,
                    ncm: dto.ncm,
                    nbs: dto.nbs,
                    cest: dto.cest,
                    cfopDefault: dto.cfopDefault,
                    active: dto.active ?? true,
                },
            });
            if (dto.type === domain_enums_1.ProductType.PRODUCT && initialStock.greaterThan(0)) {
                await tx.centerStock.create({ data: { tenantId, centerId, productId: product.id, quantity: initialStock } });
                let initialBatch = null;
                if (product.isBatchControlled) {
                    const batchCode = dto.initialBatchCode?.trim() || 'LOT-IMPLANTACAO';
                    initialBatch = await tx.productBatch.create({
                        data: {
                            tenantId,
                            centerId,
                            productId: product.id,
                            batchCode,
                            expirationDate: dto.initialBatchExpiration
                                ? new Date(dto.initialBatchExpiration)
                                : null,
                            quantity: initialStock,
                        },
                    });
                }
                await tx.stockMovement.create({
                    data: {
                        tenantId,
                        centerId,
                        productId: product.id,
                        batchId: initialBatch?.id || null,
                        movementTypeCode: domain_enums_1.MovementTypeCode.IN_PURCHASE,
                        quantity: initialStock,
                        previousStock: new client_1.Prisma.Decimal(0),
                        newStock: initialStock,
                        unitCost: costPrice,
                        totalCost: initialStock.mul(costPrice),
                        referenceType: domain_enums_1.StockReferenceType.MANUAL,
                        documentNumber: 'IMPLANTACAO-ESTOQUE',
                        reason: 'Saldo Inicial de Implantação de Estoque',
                        userId: userId || null,
                    },
                });
            }
            return product;
        });
    }
    async findAll(params) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const centerId = tenant_context_service_1.TenantContextService.getCenterId();
        const where = {
            tenantId,
            ...(params.type ? { type: params.type } : {}),
            ...(params.search
                ? {
                    OR: [
                        { name: { contains: params.search, mode: 'insensitive' } },
                        { sku: { contains: params.search, mode: 'insensitive' } },
                        { barcode: { contains: params.search } },
                    ],
                }
                : {}),
        };
        const products = await this.prisma.client.product.findMany({
            where,
            include: {
                centerStocks: { where: { centerId }, select: { quantity: true } },
                batches: {
                    where: { centerId },
                    select: { id: true, batchCode: true, expirationDate: true, quantity: true },
                },
            },
            orderBy: { name: 'asc' },
        });
        if (params.lowStockOnly) {
            return products.filter((p) => new client_1.Prisma.Decimal(p.centerStocks[0]?.quantity ?? 0).lessThanOrEqualTo(new client_1.Prisma.Decimal(p.minStock)));
        }
        return products.map((product) => ({ ...product, currentStock: product.centerStocks[0]?.quantity ?? new client_1.Prisma.Decimal(0) }));
    }
    async findOne(id) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const centerId = tenant_context_service_1.TenantContextService.getCenterId();
        const product = await this.prisma.client.product.findFirst({
            where: { id, tenantId },
            include: {
                batches: {
                    where: { centerId },
                    orderBy: [{ expirationDate: 'asc' }, { createdAt: 'desc' }],
                },
                centerStocks: { where: { centerId }, select: { quantity: true } },
                _count: {
                    select: {
                        salesOrderItems: true,
                        purchaseOrderItems: true,
                        stockMovements: true,
                        batches: true,
                    },
                },
            },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Produto com ID ${id} não encontrado.`);
        }
        return { ...product, currentStock: product.centerStocks[0]?.quantity ?? new client_1.Prisma.Decimal(0) };
    }
    async update(id, dto) {
        const existing = await this.findOne(id);
        if (dto.sku && dto.sku !== existing.sku) {
            const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
            const duplicateSku = await this.prisma.client.product.findFirst({
                where: { tenantId, sku: dto.sku, id: { not: id } },
            });
            if (duplicateSku) {
                throw new common_1.ConflictException(`O SKU "${dto.sku}" já está em uso por outro produto.`);
            }
        }
        return this.prisma.client.product.update({
            where: { id },
            data: {
                ...dto,
                salePrice: dto.salePrice !== undefined ? new client_1.Prisma.Decimal(dto.salePrice) : undefined,
                costPrice: dto.costPrice !== undefined ? new client_1.Prisma.Decimal(dto.costPrice) : undefined,
                minStock: dto.minStock !== undefined ? new client_1.Prisma.Decimal(dto.minStock) : undefined,
            },
            include: {
                batches: true,
            },
        });
    }
    async remove(id) {
        const product = await this.findOne(id);
        const hasRelations = product._count.salesOrderItems > 0 ||
            product._count.purchaseOrderItems > 0 ||
            product._count.stockMovements > 0;
        if (hasRelations) {
            return this.prisma.client.product.update({
                where: { id },
                data: { active: false },
            });
        }
        return this.prisma.client.product.delete({
            where: { id },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map