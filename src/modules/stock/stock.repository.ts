// src/modules/stock/stock.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { Prisma } from '@prisma/client';
import { StockMovementQueryDto } from './dto/create-stock-movement.dto';

@Injectable()
export class StockRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx || this.prisma.client;
  }

  /**
   * Localiza um produto dentro do contexto isolado do Tenant
   */
  async findProductById(productId: string, tenantId: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.product.findFirst({
      where: { id: productId, tenantId },
    });
  }

  /**
   * Localiza a definição do Tipo de Movimento na tabela de domínio
   */
  async findMovementType(code: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.movementType.findUnique({
      where: { code },
    });
  }

  /**
   * Localiza lote específico por ID e produto
   */
  async findBatchById(
    batchId: string,
    productId: string,
    tenantId: string,
    centerId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);
    return client.productBatch.findFirst({
      where: { id: batchId, productId, tenantId, centerId },
    });
  }

  /**
   * Localiza lote por código e produto
   */
  async findBatchByCode(
    productId: string,
    batchCode: string,
    tenantId: string,
    centerId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);
    return client.productBatch.findFirst({
      where: {
        tenantId,
        centerId,
        productId,
        batchCode: batchCode.trim(),
      },
    });
  }

  /**
   * Busca lotes com saldo positivo ordenados pelo critério PEPS / FEFO:
   * 1. Data de validade mais próxima (expiration_date ASC)
   * 2. Data de criação mais antiga (created_at ASC)
   */
  async findActiveBatchesFifo(
    productId: string,
    tenantId: string,
    centerId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);
    return client.productBatch.findMany({
      where: {
        tenantId,
        centerId,
        productId,
        quantity: { gt: 0 },
      },
      orderBy: [
        { expirationDate: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  /**
   * Cria novo registro de Lote
   */
  async createBatch(
    data: {
      tenantId: string;
      centerId: string;
      productId: string;
      batchCode: string;
      expirationDate: Date | null;
      quantity: Prisma.Decimal;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);
    return client.productBatch.create({
      data,
    });
  }

  /**
   * Atualiza saldo do lote com alta precisão decimal
   */
  async updateBatchQuantity(
    batchId: string,
    newQuantity: Prisma.Decimal,
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);
    return client.productBatch.update({
      where: { id: batchId },
      data: { quantity: newQuantity },
    });
  }

  /**
   * Atualiza saldo geral do produto no catálogo
   */
  async updateProductStock(
    productId: string,
    globalStock: Prisma.Decimal,
    centerStock: Prisma.Decimal,
    tenantId: string,
    centerId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);
    await client.centerStock.upsert({
      where: { tenantId_centerId_productId: { tenantId, centerId, productId } },
      create: { tenantId, centerId, productId, quantity: centerStock },
      update: { quantity: centerStock },
    });
    return client.product.update({ where: { id: productId }, data: { stockQuantity: globalStock } });
  }

  /**
   * Registra movimentação auditável no livro razão de estoque
   */
  async createStockMovement(data: any, tx?: Prisma.TransactionClient) {
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

  /**
   * Consulta histórico de movimentações com paginação e filtros auditáveis
   */
  async findMovementsPaginated(tenantId: string, centerId: string, filters: StockMovementQueryDto) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.StockMovementWhereInput = {
      tenantId,
      centerId,
      ...(filters.productId ? { productId: filters.productId } : {}),
      ...(filters.movementTypeCode ? { movementTypeCode: filters.movementTypeCode } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.batchId ? { batchId: filters.batchId } : {}),
      ...(filters.documentNumber ? { documentNumber: { contains: filters.documentNumber } } : {}),
    };

    // Filtro por intervalo de datas
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        // Ajusta para cobrir o dia completo se a data for fornecida como YYYY-MM-DD
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

  /**
   * Consulta os lotes e validades de um determinado produto
   */
  async findBatchesByProductId(productId: string, tenantId: string, centerId: string) {
    return this.prisma.client.productBatch.findMany({
      where: { tenantId, productId, centerId },
      orderBy: [{ expirationDate: 'asc' }, { createdAt: 'desc' }],
    });
  }
}
