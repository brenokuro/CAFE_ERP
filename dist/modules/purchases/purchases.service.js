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
exports.PurchasesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/database/prisma.service");
const tenant_context_service_1 = require("../../common/multitenancy/tenant-context.service");
const domain_enums_1 = require("../../common/enums/domain.enums");
const client_1 = require("@prisma/client");
let PurchasesService = class PurchasesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPurchase(dto) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const userId = tenant_context_service_1.TenantContextService.getUserId();
        return this.prisma.$transaction(async (tx) => {
            const lastPurchase = await tx.purchaseOrder.findFirst({
                where: { tenantId },
                orderBy: { orderNumber: 'desc' },
                select: { orderNumber: true },
            });
            const orderNumber = (lastPurchase?.orderNumber ?? 0) + 1;
            const supplier = await tx.contact.findFirst({
                where: { id: dto.supplierId, tenantId },
            });
            if (!supplier || !supplier.active) {
                throw new common_1.NotFoundException('Fornecedor informado não foi encontrado ou está inativo.');
            }
            let calculatedGross = new client_1.Prisma.Decimal(0);
            const itemsToCreate = [];
            const productsMap = new Map();
            for (const item of dto.items) {
                const product = await tx.product.findFirst({
                    where: { id: item.productId, tenantId },
                });
                if (!product) {
                    throw new common_1.NotFoundException(`Produto com ID ${item.productId} não encontrado.`);
                }
                productsMap.set(product.id, product);
                const quantity = new client_1.Prisma.Decimal(item.quantity);
                const unitCost = new client_1.Prisma.Decimal(item.unitCost);
                const discount = new client_1.Prisma.Decimal(item.discount || 0);
                const otherExpenses = new client_1.Prisma.Decimal(item.otherExpenses || 0);
                const totalCost = quantity.mul(unitCost).sub(discount).add(otherExpenses);
                calculatedGross = calculatedGross.add(quantity.mul(unitCost));
                itemsToCreate.push({
                    tenantId,
                    productId: product.id,
                    quantity,
                    unitCost,
                    discount,
                    otherExpenses,
                    totalCost,
                    notes: item.notes,
                });
            }
            const totalDiscount = new client_1.Prisma.Decimal(dto.totalDiscount || 0);
            const totalFreight = new client_1.Prisma.Decimal(dto.totalFreight || 0);
            const totalOther = new client_1.Prisma.Decimal(dto.totalOtherExpenses || 0);
            const totalNet = calculatedGross.sub(totalDiscount).add(totalFreight).add(totalOther);
            const shouldReceiveNow = dto.receiveNow !== false;
            const initialStatus = shouldReceiveNow ? domain_enums_1.PurchaseOrderStatus.RECEIVED : domain_enums_1.PurchaseOrderStatus.DRAFT;
            const purchaseOrder = await tx.purchaseOrder.create({
                data: {
                    tenantId,
                    orderNumber,
                    supplierId: dto.supplierId,
                    status: initialStatus,
                    invoiceKey: dto.invoiceKey,
                    invoiceSeries: dto.invoiceSeries,
                    invoiceNumber: dto.invoiceNumber,
                    xmlUrl: dto.xmlUrl,
                    arrivalDate: dto.arrivalDate ? new Date(dto.arrivalDate) : null,
                    totalGross: calculatedGross,
                    totalDiscount,
                    totalFreight,
                    totalOtherExpenses: totalOther,
                    totalNet,
                    notes: dto.notes,
                    items: {
                        create: itemsToCreate,
                    },
                },
                include: {
                    items: true,
                    supplier: true,
                },
            });
            if (shouldReceiveNow) {
                await this.executeCascadingReceipt(tx, purchaseOrder, productsMap, {
                    installmentsCount: dto.installmentsCount || 1,
                    firstDueDate: dto.firstDueDate,
                    categoryAccountId: dto.categoryAccountId,
                    userId,
                    tenantId,
                });
            }
            return tx.purchaseOrder.findFirst({
                where: { id: purchaseOrder.id, tenantId },
                include: {
                    items: { include: { product: true } },
                    supplier: true,
                    financialRecords: true,
                    stockMovements: true,
                },
            });
        });
    }
    async receivePurchaseOrder(purchaseOrderId, options) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const userId = tenant_context_service_1.TenantContextService.getUserId();
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.purchaseOrder.findFirst({
                where: { id: purchaseOrderId, tenantId },
                include: { items: { include: { product: true } } },
            });
            if (!order) {
                throw new common_1.NotFoundException('Pedido de compra não encontrado.');
            }
            if (order.status === domain_enums_1.PurchaseOrderStatus.RECEIVED) {
                throw new common_1.BadRequestException('Esta compra já foi recebida e processada anteriormente.');
            }
            const productsMap = new Map();
            for (const item of order.items) {
                productsMap.set(item.productId, item.product);
            }
            await this.executeCascadingReceipt(tx, order, productsMap, {
                installmentsCount: options?.installmentsCount || 1,
                firstDueDate: options?.firstDueDate,
                categoryAccountId: options?.categoryAccountId,
                userId,
                tenantId,
            });
            await tx.purchaseOrder.update({
                where: { id: order.id },
                data: { status: domain_enums_1.PurchaseOrderStatus.RECEIVED },
            });
            return tx.purchaseOrder.findFirst({
                where: { id: order.id, tenantId },
                include: {
                    items: { include: { product: true } },
                    supplier: true,
                    financialRecords: true,
                    stockMovements: true,
                },
            });
        });
    }
    async executeCascadingReceipt(tx, order, productsMap, ctx) {
        for (const item of order.items) {
            const product = productsMap.get(item.productId);
            if (product && product.type === 'PRODUCT') {
                const currentStock = new client_1.Prisma.Decimal(product.stockQuantity ?? product.currentStock ?? 0);
                const currentCostPrice = new client_1.Prisma.Decimal(product.costPrice);
                const quantityReceived = new client_1.Prisma.Decimal(item.quantity);
                const unitCostReceived = new client_1.Prisma.Decimal(item.unitCost);
                const newStock = currentStock.add(quantityReceived);
                let newCostPrice = unitCostReceived;
                if (newStock.greaterThan(0)) {
                    const currentValuation = currentStock.mul(currentCostPrice);
                    const incomingValuation = quantityReceived.mul(unitCostReceived);
                    newCostPrice = currentValuation.add(incomingValuation).div(newStock).toDecimalPlaces(4);
                }
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stockQuantity: newStock,
                        costPrice: newCostPrice,
                    },
                });
                await tx.stockMovement.create({
                    data: {
                        tenantId: ctx.tenantId,
                        productId: item.productId,
                        movementTypeCode: domain_enums_1.MovementTypeCode.IN_PURCHASE,
                        quantity: quantityReceived,
                        previousStock: currentStock,
                        newStock: newStock,
                        unitCost: unitCostReceived,
                        totalCost: quantityReceived.mul(unitCostReceived),
                        referenceType: domain_enums_1.StockReferenceType.PURCHASE_ORDER,
                        referenceId: order.id,
                        purchaseOrderId: order.id,
                        documentNumber: order.invoiceNumber || `PC-${order.orderNumber}`,
                        userId: ctx.userId || null,
                    },
                });
            }
        }
        const installments = Math.max(1, ctx.installmentsCount || 1);
        const totalNet = new client_1.Prisma.Decimal(order.totalNet);
        const baseInstallmentAmount = totalNet.div(installments).toDecimalPlaces(2, client_1.Prisma.Decimal.ROUND_DOWN);
        const remainder = totalNet.sub(baseInstallmentAmount.mul(installments));
        const initialDate = ctx.firstDueDate ? new Date(ctx.firstDueDate) : new Date();
        for (let i = 1; i <= installments; i++) {
            const dueDate = new Date(initialDate);
            if (i > 1) {
                dueDate.setDate(dueDate.getDate() + (i - 1) * 30);
            }
            const installmentAmount = i === installments ? baseInstallmentAmount.add(remainder) : baseInstallmentAmount;
            await tx.financialRecord.create({
                data: {
                    tenantId: ctx.tenantId,
                    type: domain_enums_1.FinancialRecordType.PAYABLE,
                    status: domain_enums_1.FinancialRecordStatus.PENDING,
                    description: `Compra #${order.orderNumber} ${order.invoiceNumber ? `(NF-e ${order.invoiceNumber})` : ''} - Parcela ${i}/${installments}`,
                    contactId: order.supplierId,
                    chartOfAccountId: ctx.categoryAccountId,
                    dueDate,
                    issueDate: new Date(),
                    competencyDate: new Date(),
                    originalAmount: installmentAmount,
                    balanceAmount: installmentAmount,
                    installmentNumber: i,
                    totalInstallments: installments,
                    purchaseOrderId: order.id,
                },
            });
        }
    }
    async findAll(status) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        return this.prisma.client.purchaseOrder.findMany({
            where: {
                tenantId,
                ...(status ? { status } : {}),
            },
            include: {
                supplier: { select: { id: true, name: true, document: true } },
                items: { include: { product: { select: { id: true, sku: true, name: true } } } },
                _count: { select: { financialRecords: true, stockMovements: true } },
            },
            orderBy: { orderNumber: 'desc' },
        });
    }
    async findOne(id) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const order = await this.prisma.client.purchaseOrder.findFirst({
            where: { id, tenantId },
            include: {
                supplier: true,
                items: { include: { product: true } },
                financialRecords: { orderBy: { installmentNumber: 'asc' } },
                stockMovements: { include: { product: true } },
            },
        });
        if (!order) {
            throw new common_1.NotFoundException(`Pedido de compra com ID ${id} não encontrado.`);
        }
        return order;
    }
};
exports.PurchasesService = PurchasesService;
exports.PurchasesService = PurchasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PurchasesService);
//# sourceMappingURL=purchases.service.js.map