// src/modules/purchases/purchases.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { TenantContextService } from '../../common/multitenancy/tenant-context.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import {
  FinancialRecordStatus,
  FinancialRecordType,
  MovementTypeCode,
  PurchaseOrderStatus,
  StockMovementType,
  StockReferenceType,
} from '../../common/enums/domain.enums';
import { Prisma } from '@prisma/client';

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * FLUXO ESSENCIAL: Registro de Compra / Entrada de Mercadorias (NF-e)
   * POST /purchases
   * Se receiveNow === true (padrão):
   * Executa em transação ACID única:
   * 1. Criação do Pedido de Compra e itens.
   * 2. Entrada no estoque dos produtos (Product.currentStock).
   * 3. Recálculo do Custo Médio Ponderado (Product.costPrice).
   * 4. Registro auditável em StockMovements (tipo IN_PURCHASE).
   * 5. Geração das parcelas no Contas a Pagar (FinancialRecords).
   * 6. Atualização do status para RECEIVED.
   */
  async createPurchase(dto: CreatePurchaseOrderDto) {
    const tenantId = TenantContextService.getTenantId();
    const userId = TenantContextService.getUserId();
    const centerId = TenantContextService.getCenterId();

    return this.prisma.$transaction(async (tx) => {
      // 1. Gera o próximo número sequencial de compra para este Tenant
      const lastPurchase = await tx.purchaseOrder.findFirst({
        where: { tenantId },
        orderBy: { orderNumber: 'desc' },
        select: { orderNumber: true },
      });
      const orderNumber = (lastPurchase?.orderNumber ?? 0) + 1;

      // 2. Valida fornecedor
      const supplier = await tx.contact.findFirst({
        where: { id: dto.supplierId, tenantId },
      });
      if (!supplier || !supplier.active) {
        throw new NotFoundException('Fornecedor informado não foi encontrado ou está inativo.');
      }

      // 3. Valida produtos e monta itens
      let calculatedGross = new Prisma.Decimal(0);
      const itemsToCreate = [];
      const productsMap = new Map<string, any>();

      for (const item of dto.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, tenantId },
        });

        if (!product) {
          throw new NotFoundException(`Produto com ID ${item.productId} não encontrado.`);
        }

        productsMap.set(product.id, product);

        const quantity = new Prisma.Decimal(item.quantity);
        const unitCost = new Prisma.Decimal(item.unitCost);
        const discount = new Prisma.Decimal(item.discount || 0);
        const otherExpenses = new Prisma.Decimal(item.otherExpenses || 0);
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

      const totalDiscount = new Prisma.Decimal(dto.totalDiscount || 0);
      const totalFreight = new Prisma.Decimal(dto.totalFreight || 0);
      const totalOther = new Prisma.Decimal(dto.totalOtherExpenses || 0);
      const totalNet = calculatedGross.sub(totalDiscount).add(totalFreight).add(totalOther);

      const shouldReceiveNow = dto.receiveNow !== false;
      const initialStatus = shouldReceiveNow ? PurchaseOrderStatus.RECEIVED : PurchaseOrderStatus.DRAFT;

      // 4. Cria o pedido de compra
      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          tenantId,
          centerId,
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

      // 5. Se for entrada imediata, dispara efeito cascata de estoque, custo e contas a pagar
      if (shouldReceiveNow) {
        await this.executeCascadingReceipt(tx, purchaseOrder, productsMap, {
          installmentsCount: dto.installmentsCount || 1,
          firstDueDate: dto.firstDueDate,
          categoryAccountId: dto.categoryAccountId,
          userId,
          tenantId,
          centerId,
        });
      }

      return tx.purchaseOrder.findFirst({
        where: { id: purchaseOrder.id, tenantId, centerId },
        include: {
          items: { include: { product: true } },
          supplier: true,
          financialRecords: true,
          stockMovements: true,
        },
      });
    });
  }

  /**
   * Recebe e processa uma compra que estava como Rascunho / Cotação
   * POST /purchases/:id/receive
   */
  async receivePurchaseOrder(
    purchaseOrderId: string,
    options?: {
      installmentsCount?: number;
      firstDueDate?: string;
      categoryAccountId?: string;
    },
  ) {
    const tenantId = TenantContextService.getTenantId();
    const userId = TenantContextService.getUserId();
    const centerId = TenantContextService.getCenterId();

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findFirst({
        where: { id: purchaseOrderId, tenantId, centerId },
        include: { items: { include: { product: true } } },
      });

      if (!order) {
        throw new NotFoundException('Pedido de compra não encontrado.');
      }

      if (order.status === PurchaseOrderStatus.RECEIVED) {
        throw new BadRequestException('Esta compra já foi recebida e processada anteriormente.');
      }

      const productsMap = new Map<string, any>();
      for (const item of order.items) {
        productsMap.set(item.productId, item.product);
      }

      await this.executeCascadingReceipt(tx, order, productsMap, {
        installmentsCount: options?.installmentsCount || 1,
        firstDueDate: options?.firstDueDate,
        categoryAccountId: options?.categoryAccountId,
        userId,
        tenantId,
        centerId,
      });

      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: { status: PurchaseOrderStatus.RECEIVED },
      });

      return tx.purchaseOrder.findFirst({
        where: { id: order.id, tenantId, centerId },
        include: {
          items: { include: { product: true } },
          supplier: true,
          financialRecords: true,
          stockMovements: true,
        },
      });
    });
  }

  /**
   * Efeito cascata da compra:
   * 1. Atualização do saldo de estoque (acréscimo)
   * 2. Recálculo do Custo Médio Ponderado (CMP)
   * 3. Registro auditável em StockMovements (IN_PURCHASE)
   * 4. Geração de parcelas no Contas a Pagar (FinancialRecord PAYABLE)
   */
  private async executeCascadingReceipt(
    tx: Prisma.TransactionClient,
    order: any,
    productsMap: Map<string, any>,
    ctx: {
      installmentsCount: number;
      firstDueDate?: string;
      categoryAccountId?: string;
      userId?: string;
      tenantId: string;
      centerId: string;
    },
  ) {
    for (const item of order.items) {
      const product = productsMap.get(item.productId);

      if (product && product.type === 'PRODUCT') {
        const globalStock = new Prisma.Decimal(product.stockQuantity ?? 0);
        const centerStock = await tx.centerStock.findUnique({ where: {
          tenantId_centerId_productId: { tenantId: ctx.tenantId, centerId: ctx.centerId, productId: item.productId },
        } });
        const currentStock = new Prisma.Decimal(centerStock?.quantity ?? 0);
        const currentCostPrice = new Prisma.Decimal(product.costPrice);
        const quantityReceived = new Prisma.Decimal(item.quantity);
        const unitCostReceived = new Prisma.Decimal(item.unitCost);

        const newStock = currentStock.add(quantityReceived);
        const newGlobalStock = globalStock.add(quantityReceived);

        // Recálculo do Custo Médio Ponderado (CMP)
        let newCostPrice = unitCostReceived;
        if (newGlobalStock.greaterThan(0)) {
          const currentValuation = globalStock.mul(currentCostPrice);
          const incomingValuation = quantityReceived.mul(unitCostReceived);
          newCostPrice = currentValuation.add(incomingValuation).div(newGlobalStock).toDecimalPlaces(4);
        }

        await tx.centerStock.upsert({
          where: { tenantId_centerId_productId: { tenantId: ctx.tenantId, centerId: ctx.centerId, productId: item.productId } },
          create: { tenantId: ctx.tenantId, centerId: ctx.centerId, productId: item.productId, quantity: newStock },
          update: { quantity: newStock },
        });
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: newGlobalStock,
            costPrice: newCostPrice,
          },
        });

        // Trilha auditável com código padronizado 101 (Entrada por Compra/Fornecedor)
        await tx.stockMovement.create({
          data: {
            tenantId: ctx.tenantId,
            centerId: ctx.centerId,
            productId: item.productId,
            movementTypeCode: MovementTypeCode.IN_PURCHASE,
            quantity: quantityReceived,
            previousStock: currentStock,
            newStock: newStock,
            unitCost: unitCostReceived,
            totalCost: quantityReceived.mul(unitCostReceived),
            referenceType: StockReferenceType.PURCHASE_ORDER,
            referenceId: order.id,
            purchaseOrderId: order.id,
            documentNumber: order.invoiceNumber || `PC-${order.orderNumber}`,
            userId: ctx.userId || null,
          },
        });
      }
    }

    // Geração de Contas a Pagar (Desdobramento de parcelas)
    const installments = Math.max(1, ctx.installmentsCount || 1);
    const totalNet = new Prisma.Decimal(order.totalNet);
    const baseInstallmentAmount = totalNet.div(installments).toDecimalPlaces(2, Prisma.Decimal.ROUND_DOWN);
    const remainder = totalNet.sub(baseInstallmentAmount.mul(installments));

    const initialDate = ctx.firstDueDate ? new Date(ctx.firstDueDate) : new Date();

    for (let i = 1; i <= installments; i++) {
      const dueDate = new Date(initialDate);
      if (i > 1) {
        dueDate.setDate(dueDate.getDate() + (i - 1) * 30);
      }

      const installmentAmount =
        i === installments ? baseInstallmentAmount.add(remainder) : baseInstallmentAmount;

      await tx.financialRecord.create({
        data: {
          tenantId: ctx.tenantId,
          centerId: ctx.centerId,
          type: FinancialRecordType.PAYABLE,
          status: FinancialRecordStatus.PENDING,
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

  /**
   * Lista compras realizadas com filtro por status.
   */
  async findAll(status?: PurchaseOrderStatus) {
    const tenantId = TenantContextService.getTenantId();
    const centerId = TenantContextService.getCenterId();

    return this.prisma.client.purchaseOrder.findMany({
      where: {
        tenantId,
        centerId,
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

  /**
   * Detalhes da compra pelo ID.
   */
  async findOne(id: string) {
    const tenantId = TenantContextService.getTenantId();
    const centerId = TenantContextService.getCenterId();

    const order = await this.prisma.client.purchaseOrder.findFirst({
      where: { id, tenantId, centerId },
      include: {
        supplier: true,
        items: { include: { product: true } },
        financialRecords: { orderBy: { installmentNumber: 'asc' } },
        stockMovements: { include: { product: true } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Pedido de compra com ID ${id} não encontrado.`);
    }

    return order;
  }
}
