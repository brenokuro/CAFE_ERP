// src/modules/sales/sales.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { TenantContextService } from '../../common/multitenancy/tenant-context.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import {
  FinancialRecordStatus,
  FinancialRecordType,
  MovementTypeCode,
  SalesOrderStatus,
  StockMovementType,
  StockReferenceType,
} from '../../common/enums/domain.enums';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * FLUXO ESSENCIAL: Criação e Faturamento de Venda
   * POST /sales
   * Se approveNow === true (padrão):
   * Executa em transação ACID única:
   * 1. Criação do Pedido e itens.
   * 2. Validação de estoque para todos os produtos físicos.
   * 3. Baixa em estoque (Product.currentStock).
   * 4. Registro auditável em StockMovements (tipo OUT_SALE).
   * 5. Geração das parcelas no Contas a Receber (FinancialRecords).
   * 6. Atualização do status para INVOICED.
   */
  async createOrder(dto: CreateSalesOrderDto) {
    const tenantId = TenantContextService.getTenantId();
    const userId = TenantContextService.getUserId();
    const centerId = TenantContextService.getCenterId();

    return this.prisma.$transaction(async (tx) => {
      // 1. Gera o próximo número legível de pedido para este Tenant
      const lastOrder = await tx.salesOrder.findFirst({
        where: { tenantId },
        orderBy: { orderNumber: 'desc' },
        select: { orderNumber: true },
      });
      const orderNumber = (lastOrder?.orderNumber ?? 0) + 1;

      // 2. Valida cliente
      const customer = await tx.contact.findFirst({
        where: { id: dto.customerId, tenantId },
      });
      if (!customer || !customer.active) {
        throw new NotFoundException('Cliente informado não foi encontrado ou está inativo.');
      }

      // 3. Valida produtos e monta itens
      let calculatedGross = new Prisma.Decimal(0);
      const itemsToCreate = [];
      const productsMap = new Map<string, any>();

      for (const item of dto.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, tenantId },
        });

        if (!product || !product.active) {
          throw new NotFoundException(`Produto com ID ${item.productId} não encontrado ou inativo.`);
        }

        productsMap.set(product.id, product);

        const quantity = new Prisma.Decimal(item.quantity);
        const unitPrice = new Prisma.Decimal(item.unitPrice);
        const discount = new Prisma.Decimal(item.discount || 0);
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

      const totalDiscount = new Prisma.Decimal(dto.totalDiscount || 0);
      const totalFreight = new Prisma.Decimal(dto.totalFreight || 0);
      const totalNet = calculatedGross.sub(totalDiscount).add(totalFreight);

      // 4. Cria o Pedido de Venda
      const shouldApproveNow = dto.approveNow !== false;
      const initialStatus = shouldApproveNow ? SalesOrderStatus.INVOICED : SalesOrderStatus.DRAFT;

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

      // 5. Se for aprovação/faturamento imediato, dispara automações em efeito cascata
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

      // Retorna pedido com todas as relações atualizadas
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

  /**
   * Aprova/Fatura uma venda existente que estava como Rascunho (DRAFT)
   * POST /sales/:id/invoice
   */
  async invoiceOrder(
    salesOrderId: string,
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
      const order = await tx.salesOrder.findFirst({
        where: { id: salesOrderId, tenantId, centerId },
        include: { items: { include: { product: true } } },
      });

      if (!order) {
        throw new NotFoundException('Pedido de venda não encontrado.');
      }

      if (order.status === SalesOrderStatus.INVOICED) {
        throw new BadRequestException('Este pedido já foi faturado.');
      }

      const productsMap = new Map<string, any>();
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
        data: { status: SalesOrderStatus.INVOICED },
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

  /**
   * Lógica do Efeito Cascata:
   * - Baixa de estoque com validação de saldo
   * - Histórico auditável de movimentação
   * - Desdobramento de parcelas no Contas a Receber
   */
  private async executeCascadingInvoice(
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
    // A. Efeito Cascata no Estoque
    for (const item of order.items) {
      const product = productsMap.get(item.productId);

      if (product && product.type === 'PRODUCT') {
        const centerStock = await tx.centerStock.findUnique({ where: {
          tenantId_centerId_productId: { tenantId: ctx.tenantId, centerId: ctx.centerId, productId: item.productId },
        } });
        const currentStock = new Prisma.Decimal(centerStock?.quantity ?? 0);
        const quantityToDeduct = new Prisma.Decimal(item.quantity);

        if (currentStock.lessThan(quantityToDeduct)) {
          throw new BadRequestException(
            `Estoque insuficiente para "${product.name}". Saldo disponível: ${currentStock}, Solicitado: ${quantityToDeduct}.`,
          );
        }

        const newStock = currentStock.sub(quantityToDeduct);

        // Atualiza estoque no catálogo
        await tx.centerStock.upsert({
          where: { tenantId_centerId_productId: { tenantId: ctx.tenantId, centerId: ctx.centerId, productId: item.productId } },
          create: { tenantId: ctx.tenantId, centerId: ctx.centerId, productId: item.productId, quantity: newStock },
          update: { quantity: newStock },
        });
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: quantityToDeduct } },
        });

        // Grava movimentação de saída auditável (Código 601 - Saída por Venda/Faturamento)
        await tx.stockMovement.create({
          data: {
            tenantId: ctx.tenantId,
            centerId: ctx.centerId,
            productId: item.productId,
            movementTypeCode: MovementTypeCode.OUT_SALE,
            quantity: quantityToDeduct,
            previousStock: currentStock,
            newStock: newStock,
            unitCost: product.costPrice,
            totalCost: quantityToDeduct.mul(product.costPrice),
            referenceType: StockReferenceType.SALES_ORDER,
            referenceId: order.id,
            salesOrderId: order.id,
            documentNumber: `PV-${order.orderNumber}`,
            userId: ctx.userId || null,
          },
        });
      }
    }

    // B. Efeito Cascata no Financeiro (Contas a Receber / Parcelamento)
    const installments = Math.max(1, ctx.installmentsCount || 1);
    const totalNet = new Prisma.Decimal(order.totalNet);
    const baseInstallmentAmount = totalNet.div(installments).toDecimalPlaces(2, Prisma.Decimal.ROUND_DOWN);
    const remainder = totalNet.sub(baseInstallmentAmount.mul(installments));

    const initialDate = ctx.firstDueDate ? new Date(ctx.firstDueDate) : new Date();

    for (let i = 1; i <= installments; i++) {
      const dueDate = new Date(initialDate);
      if (i > 1) {
        dueDate.setDate(dueDate.getDate() + (i - 1) * 30); // 30, 60, 90...
      }

      // Adiciona o resíduo de centavos na última parcela
      const installmentAmount =
        i === installments ? baseInstallmentAmount.add(remainder) : baseInstallmentAmount;

      await tx.financialRecord.create({
        data: {
          tenantId: ctx.tenantId,
          centerId: ctx.centerId,
          type: FinancialRecordType.RECEIVABLE,
          status: FinancialRecordStatus.PENDING,
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

  /**
   * Lista vendas com filtro por status.
   */
  async findAll(status?: SalesOrderStatus) {
    const tenantId = TenantContextService.getTenantId();
    const centerId = TenantContextService.getCenterId();

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

  /**
   * Busca detalhes completos da venda pelo ID.
   */
  async findOne(id: string) {
    const tenantId = TenantContextService.getTenantId();
    const centerId = TenantContextService.getCenterId();

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
      throw new NotFoundException(`Pedido de venda com ID ${id} não encontrado.`);
    }

    return order;
  }
}
