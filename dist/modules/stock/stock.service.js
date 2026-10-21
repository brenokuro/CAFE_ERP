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
exports.StockService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/database/prisma.service");
const tenant_context_service_1 = require("../../common/multitenancy/tenant-context.service");
const stock_repository_1 = require("./stock.repository");
const domain_enums_1 = require("../../common/enums/domain.enums");
const client_1 = require("@prisma/client");
let StockService = class StockService {
    prisma;
    stockRepository;
    constructor(prisma, stockRepository) {
        this.prisma = prisma;
        this.stockRepository = stockRepository;
    }
    async createMovement(dto) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const userId = tenant_context_service_1.TenantContextService.getUserId();
        const movementCode = String(dto.movementTypeCode || dto.movement_type_code || '').trim();
        const productId = dto.productId || dto.product_id;
        if (!movementCode) {
            throw new common_1.BadRequestException('O código do tipo de movimento (movementTypeCode) é obrigatório.');
        }
        if (!productId) {
            throw new common_1.BadRequestException('O ID do produto (productId) é obrigatório.');
        }
        const requiresReasonCodes = [
            domain_enums_1.MovementTypeCode.OUT_LOSS,
            domain_enums_1.MovementTypeCode.IN_LOSS_REV,
            domain_enums_1.MovementTypeCode.IN_PRODUCTION_REV,
            '501',
            '502',
            '202',
        ];
        const isReasonMandatory = requiresReasonCodes.includes(movementCode);
        if (isReasonMandatory && (!dto.reason || dto.reason.trim().length === 0)) {
            throw new common_1.BadRequestException(`A justificativa (reason) é estritamente obrigatória para movimentações de perda/avaria ou estorno (código ${movementCode}). Ex: "Filamento úmido / matéria-prima vencida".`);
        }
        return this.prisma.$transaction(async (tx) => {
            const product = await this.stockRepository.findProductById(productId, tenantId, tx);
            if (!product) {
                throw new common_1.NotFoundException(`Produto com ID "${productId}" não encontrado para esta empresa.`);
            }
            if (product.type === domain_enums_1.ProductType.SERVICE) {
                throw new common_1.BadRequestException('Não é permitido lançar movimentação física de estoque para itens do tipo Serviço.');
            }
            const movementType = await this.stockRepository.findMovementType(movementCode, tx);
            const entryCodes = [
                domain_enums_1.MovementTypeCode.IN_PURCHASE,
                domain_enums_1.MovementTypeCode.IN_PRODUCTION_REV,
                domain_enums_1.MovementTypeCode.IN_LOSS_REV,
                domain_enums_1.MovementTypeCode.IN_SALE_RETURN,
                '101',
                '202',
                '502',
                '602',
            ];
            const isEntry = movementType
                ? movementType.direction === domain_enums_1.MovementDirection.IN
                : entryCodes.includes(movementCode);
            const currentStock = new client_1.Prisma.Decimal(product.stockQuantity);
            const movementQty = new client_1.Prisma.Decimal(dto.quantity);
            const newStock = isEntry
                ? currentStock.add(movementQty)
                : currentStock.sub(movementQty);
            if (!isEntry && newStock.isNegative()) {
                throw new common_1.BadRequestException(`Estoque insuficiente para a baixa de "${product.name}". Saldo atual disponível: ${currentStock.toFixed(4)} ${product.unitOfMeasure}, Quantidade solicitada: ${movementQty.toFixed(4)} ${product.unitOfMeasure}. A operação foi cancelada para evitar saldo negativo.`);
            }
            const unitCost = dto.unitCost !== undefined
                ? new client_1.Prisma.Decimal(dto.unitCost)
                : product.costPrice;
            const documentNumber = dto.documentNumber || dto.document_number || `MOV-${Date.now().toString().slice(-6)}`;
            const requestedBatchId = dto.batchId || dto.batch_id;
            const requestedBatchCode = dto.batchCode || dto.batch_code;
            if (product.isBatchControlled) {
                if (isEntry) {
                    let targetBatch = null;
                    if (requestedBatchId) {
                        targetBatch = await this.stockRepository.findBatchById(requestedBatchId, product.id, tenantId, tx);
                        if (!targetBatch) {
                            throw new common_1.NotFoundException(`Lote com ID "${requestedBatchId}" não encontrado para o produto "${product.name}".`);
                        }
                    }
                    else if (requestedBatchCode) {
                        targetBatch = await this.stockRepository.findBatchByCode(product.id, requestedBatchCode, tenantId, tx);
                    }
                    if (targetBatch) {
                        const newBatchQty = new client_1.Prisma.Decimal(targetBatch.quantity).add(movementQty);
                        await this.stockRepository.updateBatchQuantity(targetBatch.id, newBatchQty, tx);
                    }
                    else {
                        const batchCodeToCreate = requestedBatchCode?.trim() || `LOT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-AUTO`;
                        const expirationDate = dto.expirationDate || dto.expiration_date
                            ? new Date(dto.expirationDate || dto.expiration_date)
                            : null;
                        targetBatch = await this.stockRepository.createBatch({
                            tenantId,
                            productId: product.id,
                            batchCode: batchCodeToCreate,
                            expirationDate,
                            quantity: movementQty,
                        }, tx);
                    }
                    await this.stockRepository.updateProductStock(product.id, newStock, tx);
                    return this.stockRepository.createStockMovement({
                        tenantId,
                        productId: product.id,
                        batchId: targetBatch.id,
                        movementTypeCode: movementCode,
                        quantity: movementQty,
                        previousStock: currentStock,
                        newStock,
                        unitCost,
                        totalCost: movementQty.mul(unitCost),
                        documentNumber,
                        userId: userId || null,
                        reason: dto.reason || null,
                        referenceType: dto.referenceType || domain_enums_1.StockReferenceType.MANUAL,
                        referenceId: dto.referenceId || null,
                        salesOrderId: dto.salesOrderId || null,
                        purchaseOrderId: dto.purchaseOrderId || null,
                    }, tx);
                }
                else {
                    if (requestedBatchId) {
                        const batch = await this.stockRepository.findBatchById(requestedBatchId, product.id, tenantId, tx);
                        if (!batch) {
                            throw new common_1.NotFoundException(`Lote com ID "${requestedBatchId}" não encontrado para o produto "${product.name}".`);
                        }
                        const currentBatchQty = new client_1.Prisma.Decimal(batch.quantity);
                        const newBatchQty = currentBatchQty.sub(movementQty);
                        if (newBatchQty.isNegative()) {
                            throw new common_1.BadRequestException(`Saldo insuficiente no lote selecionado "${batch.batchCode}". Saldo disponível no lote: ${currentBatchQty.toFixed(4)} ${product.unitOfMeasure}, Quantidade solicitada: ${movementQty.toFixed(4)} ${product.unitOfMeasure}.`);
                        }
                        await this.stockRepository.updateBatchQuantity(batch.id, newBatchQty, tx);
                        await this.stockRepository.updateProductStock(product.id, newStock, tx);
                        return this.stockRepository.createStockMovement({
                            tenantId,
                            productId: product.id,
                            batchId: batch.id,
                            movementTypeCode: movementCode,
                            quantity: movementQty,
                            previousStock: currentStock,
                            newStock,
                            unitCost,
                            totalCost: movementQty.mul(unitCost),
                            documentNumber,
                            userId: userId || null,
                            reason: dto.reason || null,
                            referenceType: dto.referenceType || domain_enums_1.StockReferenceType.MANUAL,
                            referenceId: dto.referenceId || null,
                            salesOrderId: dto.salesOrderId || null,
                            purchaseOrderId: dto.purchaseOrderId || null,
                        }, tx);
                    }
                    const activeBatches = await this.stockRepository.findActiveBatchesFifo(product.id, tenantId, tx);
                    if (!activeBatches || activeBatches.length === 0) {
                        throw new common_1.BadRequestException(`O produto "${product.name}" exige controle de lote, mas não há lotes com saldo disponível para atender a baixa de ${movementQty.toFixed(4)} ${product.unitOfMeasure}.`);
                    }
                    const totalInBatches = activeBatches.reduce((acc, b) => acc.add(new client_1.Prisma.Decimal(b.quantity)), new client_1.Prisma.Decimal(0));
                    if (totalInBatches.lessThan(movementQty)) {
                        throw new common_1.BadRequestException(`Saldo insuficiente nos lotes do produto "${product.name}". Saldo total em lotes ativos: ${totalInBatches.toFixed(4)} ${product.unitOfMeasure}, Solicitado: ${movementQty.toFixed(4)} ${product.unitOfMeasure}.`);
                    }
                    let remainingToDeduct = new client_1.Prisma.Decimal(movementQty);
                    let primaryMovementResult = null;
                    let currentProductStockSnapshot = new client_1.Prisma.Decimal(currentStock);
                    for (const batch of activeBatches) {
                        if (remainingToDeduct.isZero() || remainingToDeduct.isNegative()) {
                            break;
                        }
                        const batchQty = new client_1.Prisma.Decimal(batch.quantity);
                        const qtyFromThisBatch = client_1.Prisma.Decimal.min(batchQty, remainingToDeduct);
                        const newBatchQty = batchQty.sub(qtyFromThisBatch);
                        await this.stockRepository.updateBatchQuantity(batch.id, newBatchQty, tx);
                        const nextProductStock = currentProductStockSnapshot.sub(qtyFromThisBatch);
                        const movementRecord = await this.stockRepository.createStockMovement({
                            tenantId,
                            productId: product.id,
                            batchId: batch.id,
                            movementTypeCode: movementCode,
                            quantity: qtyFromThisBatch,
                            previousStock: currentProductStockSnapshot,
                            newStock: nextProductStock,
                            unitCost,
                            totalCost: qtyFromThisBatch.mul(unitCost),
                            documentNumber,
                            userId: userId || null,
                            reason: dto.reason || (activeBatches.length > 1 ? `Baixa automática PEPS/FIFO (Lote ${batch.batchCode})` : null),
                            referenceType: dto.referenceType || domain_enums_1.StockReferenceType.MANUAL,
                            referenceId: dto.referenceId || null,
                            salesOrderId: dto.salesOrderId || null,
                            purchaseOrderId: dto.purchaseOrderId || null,
                        }, tx);
                        if (!primaryMovementResult) {
                            primaryMovementResult = movementRecord;
                        }
                        currentProductStockSnapshot = nextProductStock;
                        remainingToDeduct = remainingToDeduct.sub(qtyFromThisBatch);
                    }
                    await this.stockRepository.updateProductStock(product.id, newStock, tx);
                    return primaryMovementResult;
                }
            }
            await this.stockRepository.updateProductStock(product.id, newStock, tx);
            return this.stockRepository.createStockMovement({
                tenantId,
                productId: product.id,
                batchId: null,
                movementTypeCode: movementCode,
                quantity: movementQty,
                previousStock: currentStock,
                newStock,
                unitCost,
                totalCost: movementQty.mul(unitCost),
                documentNumber,
                userId: userId || null,
                reason: dto.reason || null,
                referenceType: dto.referenceType || domain_enums_1.StockReferenceType.MANUAL,
                referenceId: dto.referenceId || null,
                salesOrderId: dto.salesOrderId || null,
                purchaseOrderId: dto.purchaseOrderId || null,
            }, tx);
        });
    }
    async createManualMovement(dto) {
        return this.createMovement(dto);
    }
    async getMovements(filters) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        return this.stockRepository.findMovementsPaginated(tenantId, filters);
    }
    async createBatch(dto) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const productId = dto.productId || dto.product_id;
        const batchCode = (dto.batchCode || dto.batch_code || '').trim();
        if (!productId) {
            throw new common_1.BadRequestException('O ID do produto (productId) é obrigatório.');
        }
        if (!batchCode) {
            throw new common_1.BadRequestException('O código do lote (batchCode) é obrigatório.');
        }
        const product = await this.stockRepository.findProductById(productId, tenantId);
        if (!product) {
            throw new common_1.NotFoundException(`Produto com ID "${productId}" não encontrado.`);
        }
        const existingBatch = await this.stockRepository.findBatchByCode(productId, batchCode, tenantId);
        if (existingBatch) {
            throw new common_1.ConflictException(`O lote "${batchCode}" já está cadastrado para este produto.`);
        }
        const expirationDate = dto.expirationDate || dto.expiration_date
            ? new Date(dto.expirationDate || dto.expiration_date)
            : null;
        return this.stockRepository.createBatch({
            tenantId,
            productId,
            batchCode,
            expirationDate,
            quantity: new client_1.Prisma.Decimal(dto.initialQuantity || dto.initial_quantity || 0),
        });
    }
    async getProductBatches(productId) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const product = await this.stockRepository.findProductById(productId, tenantId);
        if (!product) {
            throw new common_1.NotFoundException(`Produto com ID "${productId}" não encontrado.`);
        }
        const batches = await this.stockRepository.findBatchesByProductId(productId, tenantId);
        const now = new Date();
        return batches.map((b) => {
            let daysUntilExpiration = null;
            let status = 'NO_EXPIRY';
            if (b.expirationDate) {
                const exp = new Date(b.expirationDate);
                const diffTime = exp.getTime() - now.getTime();
                daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (daysUntilExpiration < 0) {
                    status = 'EXPIRED';
                }
                else if (daysUntilExpiration <= 30) {
                    status = 'EXPIRING_SOON';
                }
                else {
                    status = 'VALID';
                }
            }
            return {
                id: b.id,
                tenantId: b.tenantId,
                productId: b.productId,
                batchCode: b.batchCode,
                expirationDate: b.expirationDate,
                quantity: Number(b.quantity),
                daysUntilExpiration,
                status,
                createdAt: b.createdAt,
                updatedAt: b.updatedAt,
            };
        });
    }
};
exports.StockService = StockService;
exports.StockService = StockService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        stock_repository_1.StockRepository])
], StockService);
//# sourceMappingURL=stock.service.js.map