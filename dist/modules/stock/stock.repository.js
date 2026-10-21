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
exports.StockRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/database/prisma.service");
let StockRepository = class StockRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getClient(tx) {
        return tx || this.prisma.client;
    }
    async findProductById(productId, tenantId, tx) {
        const client = this.getClient(tx);
        return client.product.findFirst({
            where: { id: productId, tenantId },
        });
    }
    async findMovementType(code, tx) {
        const client = this.getClient(tx);
        return client.movementType.findUnique({
            where: { code },
        });
    }
    async findBatchById(batchId, productId, tenantId, tx) {
        const client = this.getClient(tx);
        return client.productBatch.findFirst({
            where: { id: batchId, productId, tenantId },
        });
    }
    async findBatchByCode(productId, batchCode, tenantId, tx) {
        const client = this.getClient(tx);
        return client.productBatch.findFirst({
            where: {
                tenantId,
                productId,
                batchCode: batchCode.trim(),
            },
        });
    }
    async findActiveBatchesFifo(productId, tenantId, tx) {
        const client = this.getClient(tx);
        return client.productBatch.findMany({
            where: {
                tenantId,
                productId,
                quantity: { gt: 0 },
            },
            orderBy: [
                { expirationDate: 'asc' },
                { createdAt: 'asc' },
            ],
        });
    }
    async createBatch(data, tx) {
        const client = this.getClient(tx);
        return client.productBatch.create({
            data,
        });
    }
    async updateBatchQuantity(batchId, newQuantity, tx) {
        const client = this.getClient(tx);
        return client.productBatch.update({
            where: { id: batchId },
            data: { quantity: newQuantity },
        });
    }
    async updateProductStock(productId, newStock, tx) {
        const client = this.getClient(tx);
        return client.product.update({
            where: { id: productId },
            data: { stockQuantity: newStock },
        });
    }
    async createStockMovement(data, tx) {
        const client = this.getClient(tx);
        return client.stockMovement.create({
            data,
            include: {
                product: {
                    select: { id: true, sku: true, name: true, unitOfMeasure: true },
                },
                batch: {
                    select: { id: true, batchCode: true, expirationDate: true, quantity: true },
                },
                movementType: {
                    select: { code: true, description: true, direction: true },
                },
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    }
    async findMovementsPaginated(tenantId, filters) {
        const page = Math.max(1, Number(filters.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(filters.limit) || 20));
        const skip = (page - 1) * limit;
        const where = {
            tenantId,
            ...(filters.productId ? { productId: filters.productId } : {}),
            ...(filters.movementTypeCode ? { movementTypeCode: filters.movementTypeCode } : {}),
            ...(filters.userId ? { userId: filters.userId } : {}),
            ...(filters.batchId ? { batchId: filters.batchId } : {}),
            ...(filters.documentNumber ? { documentNumber: { contains: filters.documentNumber } } : {}),
        };
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                where.createdAt.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                const end = new Date(filters.endDate);
                if (filters.endDate.length <= 10) {
                    end.setHours(23, 59, 59, 999);
                }
                where.createdAt.lte = end;
            }
        }
        const [movements, total] = await Promise.all([
            this.prisma.client.stockMovement.findMany({
                where,
                include: {
                    product: {
                        select: { id: true, sku: true, name: true, unitOfMeasure: true },
                    },
                    batch: {
                        select: { id: true, batchCode: true, expirationDate: true, quantity: true },
                    },
                    movementType: {
                        select: { code: true, description: true, direction: true },
                    },
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.client.stockMovement.count({ where }),
        ]);
        return {
            data: movements,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
                hasNextPage: page * limit < total,
                hasPreviousPage: page > 1,
            },
        };
    }
    async findBatchesByProductId(productId, tenantId) {
        return this.prisma.client.productBatch.findMany({
            where: { tenantId, productId },
            orderBy: [{ expirationDate: 'asc' }, { createdAt: 'desc' }],
        });
    }
};
exports.StockRepository = StockRepository;
exports.StockRepository = StockRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StockRepository);
//# sourceMappingURL=stock.repository.js.map