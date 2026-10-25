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
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/database/prisma.service");
const tenant_context_service_1 = require("../../common/multitenancy/tenant-context.service");
const domain_enums_1 = require("../../common/enums/domain.enums");
const client_1 = require("@prisma/client");
let SalesService = class SalesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createOrder(dto) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const userId = tenant_context_service_1.TenantContextService.getUserId();
        const centerId = tenant_context_service_1.TenantContextService.getCenterId();
        return this.prisma.$transaction(async (tx) => {
            const lastOrder = await tx.salesOrder.findFirst({
                where: { tenantId },
                orderBy: { orderNumber: 'desc' },
                select: { orderNumber: true },
            });
            const orderNumber = (lastOrder?.orderNumber ?? 0) + 1;
            const customer = await tx.contact.findFirst({
                where: { id: dto.customerId, tenantId },
            });
            if (!customer || !customer.active) {
                throw new common_1.NotFoundException('Cliente informado não foi encontrado ou está inativo.');
            }
            let calculatedGross = new client_1.Prisma.Decimal(0);
            const itemsToCreate = [];
            const productsMap = new Map();
            for (const item of dto.items) {
                const product = await tx.product.findFirst({
                    where: { id: item.productId, tenantId },
                });
                if (!product || !product.active) {
                    throw new common_1.NotFoundException(`Produto com ID ${item.productId} não encontrado ou inativo.`);
                }
                productsMap.set(product.id, product);
                const quantity = new client_1.Prisma.Decimal(item.quantity);
                const unitPrice = new client_1.Prisma.Decimal(item.unitPrice);
                const discount = new client_1.Prisma.Decimal(item.discount || 0);
                const totalPrice = quantity.mul(unitPrice).sub(discount);
                calculatedGross = calculatedGross.add(quantity.mul(unitPrice));
                itemsToCreate.push({
                    tenantId,
                    productId: product.id,
                    quantity,
                    unitPrice,
                    discount,
                    totalPrice,
                    notes: item.notes,
                });
            }
            const totalDiscount = new client_1.Prisma.Decimal(dto.totalDiscount || 0);
            const totalFreight = new client_1.Prisma.Decimal(dto.totalFreight || 0);
            const totalNet = calculatedGross.sub(totalDiscount).add(totalFreight);
            const shouldApproveNow = dto.approveNow !== false;
            const initialStatus = shouldApproveNow ? domain_enums_1.SalesOrderStatus.INVOICED : domain_enums_1.SalesOrderStatus.DRAFT;
            const salesOrder = await tx.salesOrder.create({
                data: {
                    tenantId,
                    centerId,
                    orderNumber,
                    customerId: dto.customerId,
                    status: initialStatus,
                    deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
                    paymentTerm: dto.paymentTerm,
                    totalGross: calculatedGross,
                    totalDiscount,
                    totalFreight,
                    totalNet,
                    notes: dto.notes,
                    items: {
                        create: itemsToCreate,
                    },
                },
                include: {
                    items: true,
                    customer: true,
                },
            });
            if (shouldApproveNow) {
                await this.executeCascadingInvoice(tx, salesOrder, productsMap, {
                    installmentsCount: dto.installmentsCount || 1,
                    firstDueDate: dto.firstDueDate,
                    categoryAccountId: dto.categoryAccountId,
                    userId,
                    tenantId,
                    centerId,
                });
            }
            return tx.salesOrder.findFirst({
                where: { id: salesOrder.id, tenantId, centerId },
                include: {
                    items: { include: { product: true } },
                    customer: true,
                    financialRecords: true,
                    stockMovements: true,
                },
            });
        });
    }
    async invoiceOrder(salesOrderId, options) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const userId = tenant_context_service_1.TenantContextService.getUserId();
        const centerId = tenant_context_service_1.TenantContextService.getCenterId();
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.salesOrder.findFirst({
                where: { id: salesOrderId, tenantId, centerId },
                include: { items: { include: { product: true } } },
            });
            if (!order) {
                throw new common_1.NotFoundException('Pedido de venda não encontrado.');
            }
            if (order.status === domain_enums_1.SalesOrderStatus.INVOICED) {
                throw new common_1.BadRequestException('Este pedido já foi faturado.');
            }
            const productsMap = new Map();
            for (const item of order.items) {
                productsMap.set(item.productId, item.product);
            }
            await this.executeCascadingInvoice(tx, order, productsMap, {
                installmentsCount: options?.installmentsCount || 1,
                firstDueDate: options?.firstDueDate,
                categoryAccountId: options?.categoryAccountId,
                userId,
                tenantId,
                centerId,
            });
            await tx.salesOrder.update({
                where: { id: order.id },
                data: { status: domain_enums_1.SalesOrderStatus.INVOICED },
            });
            return tx.salesOrder.findFirst({
                where: { id: order.id, tenantId, centerId },
                include: {
                    items: { include: { product: true } },
                    customer: true,
                    financialRecords: true,
                    stockMovements: true,
                },
            });
        });
    }
    async executeCascadingInvoice(tx, order, productsMap, ctx) {
        for (const item of order.items) {
            const product = productsMap.get(item.productId);
            if (product && product.type === 'PRODUCT') {
                const centerStock = await tx.centerStock.findUnique({ where: {
                        tenantId_centerId_productId: { tenantId: ctx.tenantId, centerId: ctx.centerId, productId: item.productId },
                    } });
                const currentStock = new client_1.Prisma.Decimal(centerStock?.quantity ?? 0);
                const quantityToDeduct = new client_1.Prisma.Decimal(item.quantity);
                if (currentStock.lessThan(quantityToDeduct)) {
                    throw new common_1.BadRequestException(`Estoque insuficiente para "${product.name}". Saldo disponível: ${currentStock}, Solicitado: ${quantityToDeduct}.`);
                }
                const newStock = currentStock.sub(quantityToDeduct);
                await tx.centerStock.upsert({
                    where: { tenantId_centerId_productId: { tenantId: ctx.tenantId, centerId: ctx.centerId, productId: item.productId } },
                    create: { tenantId: ctx.tenantId, centerId: ctx.centerId, productId: item.productId, quantity: newStock },
                    update: { quantity: newStock },
                });
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stockQuantity: { decrement: quantityToDeduct } },
                });
                await tx.stockMovement.create({
                    data: {
                        tenantId: ctx.tenantId,
                        centerId: ctx.centerId,
                        productId: item.productId,
                        movementTypeCode: domain_enums_1.MovementTypeCode.OUT_SALE,
                        quantity: quantityToDeduct,
                        previousStock: currentStock,
                        newStock: newStock,
                        unitCost: product.costPrice,
                        totalCost: quantityToDeduct.mul(product.costPrice),
                        referenceType: domain_enums_1.StockReferenceType.SALES_ORDER,
                        referenceId: order.id,
                        salesOrderId: order.id,
                        documentNumber: `PV-${order.orderNumber}`,
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
                    centerId: ctx.centerId,
                    type: domain_enums_1.FinancialRecordType.RECEIVABLE,
                    status: domain_enums_1.FinancialRecordStatus.PENDING,
                    description: `Venda #${order.orderNumber} - Parcela ${i}/${installments}`,
                    contactId: order.customerId,
                    chartOfAccountId: ctx.categoryAccountId,
                    dueDate,
                    issueDate: new Date(),
                    competencyDate: new Date(),
                    originalAmount: installmentAmount,
                    balanceAmount: installmentAmount,
                    installmentNumber: i,
                    totalInstallments: installments,
                    salesOrderId: order.id,
                },
            });
        }
    }
    async findAll(status) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const centerId = tenant_context_service_1.TenantContextService.getCenterId();
        return this.prisma.client.salesOrder.findMany({
            where: {
                tenantId,
                centerId,
                ...(status ? { status } : {}),
            },
            include: {
                customer: { select: { id: true, name: true, document: true } },
                items: { include: { product: { select: { id: true, sku: true, name: true } } } },
                _count: { select: { financialRecords: true, stockMovements: true } },
            },
            orderBy: { orderNumber: 'desc' },
        });
    }
    async findOne(id) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const centerId = tenant_context_service_1.TenantContextService.getCenterId();
        const order = await this.prisma.client.salesOrder.findFirst({
            where: { id, tenantId, centerId },
            include: {
                customer: true,
                items: { include: { product: true } },
                financialRecords: { orderBy: { installmentNumber: 'asc' } },
                stockMovements: { include: { product: true } },
            },
        });
        if (!order) {
            throw new common_1.NotFoundException(`Pedido de venda com ID ${id} não encontrado.`);
        }
        return order;
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SalesService);
//# sourceMappingURL=sales.service.js.map