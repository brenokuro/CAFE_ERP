// src/modules/products/products.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { TenantContextService } from '../../common/multitenancy/tenant-context.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  MovementTypeCode,
  ProductType,
  StockReferenceType,
  UnitOfMeasure,
} from '../../common/enums/domain.enums';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um produto ou serviço. Se houver estoque inicial informado,
   * cria a movimentação de estoque auditável e o lote inicial em transação ACID.
   */
  async create(dto: CreateProductDto) {
    const tenantId = TenantContextService.getTenantId();
    const userId = TenantContextService.getUserId();
    const centerId = TenantContextService.getCenterId();

    // 1. Verifica unicidade de SKU no Tenant
    const existingSku = await this.prisma.client.product.findFirst({
      where: { tenantId, sku: dto.sku },
    });

    if (existingSku) {
      throw new ConflictException(`Já existe um produto com o SKU "${dto.sku}" nesta empresa.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const initialStock = new Prisma.Decimal(dto.initialStock || 0);
      const salePrice = new Prisma.Decimal(dto.salePrice);
      const costPrice = new Prisma.Decimal(dto.costPrice || 0);
      const minStock = new Prisma.Decimal(dto.minStock || 0);

      // Criação do produto com suporte a insumos fracionados e lote
      const product = await tx.product.create({
        data: {
          tenantId,
          type: dto.type,
          sku: dto.sku,
          barcode: dto.barcode,
          name: dto.name,
          description: dto.description,
          unitOfMeasure: dto.unitOfMeasure || UnitOfMeasure.UN,
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

      // Se houver saldo inicial e for produto físico
      if (dto.type === ProductType.PRODUCT && initialStock.greaterThan(0)) {
        await tx.centerStock.create({ data: { tenantId, centerId, productId: product.id, quantity: initialStock } });
        let initialBatch: any = null;

        // Se o produto for controlado por lote, registra o lote inicial
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

        // Registra movimentação auditável de implantação com tipo padronizado 101
        await tx.stockMovement.create({
          data: {
            tenantId,
            centerId,
            productId: product.id,
            batchId: initialBatch?.id || null,
            movementTypeCode: MovementTypeCode.IN_PURCHASE,
            quantity: initialStock,
            previousStock: new Prisma.Decimal(0),
            newStock: initialStock,
            unitCost: costPrice,
            totalCost: initialStock.mul(costPrice),
            referenceType: StockReferenceType.MANUAL,
            documentNumber: 'IMPLANTACAO-ESTOQUE',
            reason: 'Saldo Inicial de Implantação de Estoque',
            userId: userId || null,
          },
        });
      }

      return product;
    });
  }

  /**
   * Lista catálogo com filtros avançados (tipo, alerta de estoque baixo, termo de busca).
   */
  async findAll(params: {
    type?: ProductType;
    lowStockOnly?: boolean;
    search?: string;
  }) {
    const tenantId = TenantContextService.getTenantId();
    const centerId = TenantContextService.getCenterId();

    const where: Prisma.ProductWhereInput = {
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
      return products.filter((p: any) => new Prisma.Decimal(p.centerStocks[0]?.quantity ?? 0).lessThanOrEqualTo(new Prisma.Decimal(p.minStock)));
    }

    return products.map((product: any) => ({ ...product, currentStock: product.centerStocks[0]?.quantity ?? new Prisma.Decimal(0) }));
  }

  /**
   * Busca produto por ID com lotes e validação de Tenant.
   */
  async findOne(id: string) {
    const tenantId = TenantContextService.getTenantId();
    const centerId = TenantContextService.getCenterId();

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
      throw new NotFoundException(`Produto com ID ${id} não encontrado.`);
    }

    return { ...product, currentStock: product.centerStocks[0]?.quantity ?? new Prisma.Decimal(0) };
  }

  /**
   * Atualiza dados cadastrais e de precificação do produto.
   */
  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.findOne(id);

    if (dto.sku && dto.sku !== existing.sku) {
      const tenantId = TenantContextService.getTenantId();
      const duplicateSku = await this.prisma.client.product.findFirst({
        where: { tenantId, sku: dto.sku, id: { not: id } },
      });
      if (duplicateSku) {
        throw new ConflictException(`O SKU "${dto.sku}" já está em uso por outro produto.`);
      }
    }

    return this.prisma.client.product.update({
      where: { id },
      data: {
        ...dto,
        salePrice: dto.salePrice !== undefined ? new Prisma.Decimal(dto.salePrice) : undefined,
        costPrice: dto.costPrice !== undefined ? new Prisma.Decimal(dto.costPrice) : undefined,
        minStock: dto.minStock !== undefined ? new Prisma.Decimal(dto.minStock) : undefined,
      },
      include: {
        batches: true,
      },
    });
  }

  /**
   * Remove ou desativa produto conforme existência de vínculos em vendas/compras.
   */
  async remove(id: string) {
    const product = await this.findOne(id);

    const hasRelations =
      product._count.salesOrderItems > 0 ||
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
}
