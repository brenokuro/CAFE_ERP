// src/modules/stock/stock.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { TenantContextService } from '../../common/multitenancy/tenant-context.service';
import { StockRepository } from './stock.repository';
import {
  CreateStockMovementDto,
  StockMovementQueryDto,
} from './dto/create-stock-movement.dto';
import {
  BatchExpirationStatus,
  CreateProductBatchDto,
  ProductBatchResponseDto,
} from './dto/create-batch.dto';
import {
  MovementDirection,
  MovementTypeCode,
  ProductType,
  StockReferenceType,
} from '../../common/enums/domain.enums';
import { Prisma } from '@prisma/client';

@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockRepository: StockRepository,
  ) {}

  /**
   * MOTOR TRANSACIONAL DE MOVIMENTAÇÕES DE ESTOQUE (ACID)
   * Executa validação de saldo negativo, lotes, justificativas obrigatórias e PEPS/FIFO.
   */
  async createMovement(dto: CreateStockMovementDto) {
    const tenantId = TenantContextService.getTenantId();
    const userId = TenantContextService.getUserId();

    const movementCode = String(dto.movementTypeCode || dto.movement_type_code || '').trim();
    const productId = dto.productId || dto.product_id;

    if (!movementCode) {
      throw new BadRequestException('O código do tipo de movimento (movementTypeCode) é obrigatório.');
    }

    if (!productId) {
      throw new BadRequestException('O ID do produto (productId) é obrigatório.');
    }

    // Regra de Negócio: Justificativa obrigatória para perdas (501) e estornos (202, 502)
    const requiresReasonCodes = [
      MovementTypeCode.OUT_LOSS,
      MovementTypeCode.IN_LOSS_REV,
      MovementTypeCode.IN_PRODUCTION_REV,
      '501',
      '502',
      '202',
    ];
    const isReasonMandatory = requiresReasonCodes.includes(movementCode as any);

    if (isReasonMandatory && (!dto.reason || dto.reason.trim().length === 0)) {
      throw new BadRequestException(
        `A justificativa (reason) é estritamente obrigatória para movimentações de perda/avaria ou estorno (código ${movementCode}). Ex: "Filamento úmido / matéria-prima vencida".`,
      );
    }

    // Executa em transação ACID única
    return this.prisma.$transaction(async (tx) => {
      // 1. Busca o produto com validação de multi-tenancy
      const product = await this.stockRepository.findProductById(productId, tenantId, tx);

      if (!product) {
        throw new NotFoundException(`Produto com ID "${productId}" não encontrado para esta empresa.`);
      }

      if (product.type === ProductType.SERVICE) {
        throw new BadRequestException('Não é permitido lançar movimentação física de estoque para itens do tipo Serviço.');
      }

      // 2. Determina a direção da movimentação (Entrada vs Saída)
      const movementType = await this.stockRepository.findMovementType(movementCode, tx);

      const entryCodes = [
        MovementTypeCode.IN_PURCHASE,
        MovementTypeCode.IN_PRODUCTION_REV,
        MovementTypeCode.IN_LOSS_REV,
        MovementTypeCode.IN_SALE_RETURN,
        '101',
        '202',
        '502',
        '602',
      ];
      const isEntry = movementType
        ? movementType.direction === MovementDirection.IN
        : entryCodes.includes(movementCode as any);

      // 3. Validação de Estoque Negativo Geral
      const currentStock = new Prisma.Decimal(product.stockQuantity);
      const movementQty = new Prisma.Decimal(dto.quantity);

      const newStock = isEntry
        ? currentStock.add(movementQty)
        : currentStock.sub(movementQty);

      if (!isEntry && newStock.isNegative()) {
        throw new BadRequestException(
          `Estoque insuficiente para a baixa de "${product.name}". Saldo atual disponível: ${currentStock.toFixed(4)} ${product.unitOfMeasure}, Quantidade solicitada: ${movementQty.toFixed(4)} ${product.unitOfMeasure}. A operação foi cancelada para evitar saldo negativo.`,
        );
      }

      const unitCost = dto.unitCost !== undefined
        ? new Prisma.Decimal(dto.unitCost)
        : product.costPrice;

      // 4. Lógica de Lotes (ProductBatches) & Sugestão PEPS/FIFO
      const documentNumber = dto.documentNumber || dto.document_number || `MOV-${Date.now().toString().slice(-6)}`;
      const requestedBatchId = dto.batchId || dto.batch_id;
      const requestedBatchCode = dto.batchCode || dto.batch_code;

      // ==========================================
      // CASO A: PRODUTO CONTROLADO POR LOTE
      // ==========================================
      if (product.isBatchControlled) {
        if (isEntry) {
          // --- ENTRADA DE LOTE (101, 202, 502) ---
          let targetBatch: any = null;

          if (requestedBatchId) {
            targetBatch = await this.stockRepository.findBatchById(requestedBatchId, product.id, tenantId, tx);
            if (!targetBatch) {
              throw new NotFoundException(`Lote com ID "${requestedBatchId}" não encontrado para o produto "${product.name}".`);
            }
          } else if (requestedBatchCode) {
            targetBatch = await this.stockRepository.findBatchByCode(product.id, requestedBatchCode, tenantId, tx);
          }

          if (targetBatch) {
            // Incrementa lote existente
            const newBatchQty = new Prisma.Decimal(targetBatch.quantity).add(movementQty);
            await this.stockRepository.updateBatchQuantity(targetBatch.id, newBatchQty, tx);
          } else {
            // Cria novo lote no recebimento
            const batchCodeToCreate = requestedBatchCode?.trim() || `LOT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-AUTO`;
            const expirationDate = dto.expirationDate || dto.expiration_date
              ? new Date(dto.expirationDate || dto.expiration_date!)
              : null;

            targetBatch = await this.stockRepository.createBatch(
              {
                tenantId,
                productId: product.id,
                batchCode: batchCodeToCreate,
                expirationDate,
                quantity: movementQty,
              },
              tx,
            );
          }

          // Atualiza saldo geral do produto
          await this.stockRepository.updateProductStock(product.id, newStock, tx);

          // Registra movimentação auditável
          return this.stockRepository.createStockMovement(
            {
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
              referenceType: dto.referenceType || StockReferenceType.MANUAL,
              referenceId: dto.referenceId || null,
              salesOrderId: dto.salesOrderId || null,
              purchaseOrderId: dto.purchaseOrderId || null,
            },
            tx,
          );
        } else {
          // --- SAÍDA DE LOTE (201, 501, 601) ---

          // Subcaso A.1: batchId explicitamente informado
          if (requestedBatchId) {
            const batch = await this.stockRepository.findBatchById(requestedBatchId, product.id, tenantId, tx);

            if (!batch) {
              throw new NotFoundException(`Lote com ID "${requestedBatchId}" não encontrado para o produto "${product.name}".`);
            }

            const currentBatchQty = new Prisma.Decimal(batch.quantity);
            const newBatchQty = currentBatchQty.sub(movementQty);

            if (newBatchQty.isNegative()) {
              throw new BadRequestException(
                `Saldo insuficiente no lote selecionado "${batch.batchCode}". Saldo disponível no lote: ${currentBatchQty.toFixed(4)} ${product.unitOfMeasure}, Quantidade solicitada: ${movementQty.toFixed(4)} ${product.unitOfMeasure}.`,
              );
            }

            await this.stockRepository.updateBatchQuantity(batch.id, newBatchQty, tx);
            await this.stockRepository.updateProductStock(product.id, newStock, tx);

            return this.stockRepository.createStockMovement(
              {
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
                referenceType: dto.referenceType || StockReferenceType.MANUAL,
                referenceId: dto.referenceId || null,
                salesOrderId: dto.salesOrderId || null,
                purchaseOrderId: dto.purchaseOrderId || null,
              },
              tx,
            );
          }

          // Subcaso A.2: batchId NÃO informado -> APLICAÇÃO DA REGRA PEPS/FIFO (FEFO)
          // Busca lotes com saldo > 0 ordenados pela expiration_date mais próxima
          const activeBatches = await this.stockRepository.findActiveBatchesFifo(product.id, tenantId, tx);

          if (!activeBatches || activeBatches.length === 0) {
            throw new BadRequestException(
              `O produto "${product.name}" exige controle de lote, mas não há lotes com saldo disponível para atender a baixa de ${movementQty.toFixed(4)} ${product.unitOfMeasure}.`,
            );
          }

          // Calcula saldo total disponível nos lotes
          const totalInBatches = activeBatches.reduce(
            (acc: Prisma.Decimal, b: any) => acc.add(new Prisma.Decimal(b.quantity)),
            new Prisma.Decimal(0),
          );

          if (totalInBatches.lessThan(movementQty)) {
            throw new BadRequestException(
              `Saldo insuficiente nos lotes do produto "${product.name}". Saldo total em lotes ativos: ${totalInBatches.toFixed(4)} ${product.unitOfMeasure}, Solicitado: ${movementQty.toFixed(4)} ${product.unitOfMeasure}.`,
            );
          }

          // Executa baixa priorizando o lote com vencimento mais próximo (PEPS/FIFO)
          let remainingToDeduct = new Prisma.Decimal(movementQty);
          let primaryMovementResult: any = null;
          let currentProductStockSnapshot = new Prisma.Decimal(currentStock);

          for (const batch of activeBatches) {
            if (remainingToDeduct.isZero() || remainingToDeduct.isNegative()) {
              break;
            }

            const batchQty = new Prisma.Decimal(batch.quantity);
            // Quantidade a retirar deste lote
            const qtyFromThisBatch = Prisma.Decimal.min(batchQty, remainingToDeduct);
            const newBatchQty = batchQty.sub(qtyFromThisBatch);

            // Atualiza saldo do lote
            await this.stockRepository.updateBatchQuantity(batch.id, newBatchQty, tx);

            const nextProductStock = currentProductStockSnapshot.sub(qtyFromThisBatch);

            // Registra movimento auditável para este lote específico
            const movementRecord = await this.stockRepository.createStockMovement(
              {
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
                referenceType: dto.referenceType || StockReferenceType.MANUAL,
                referenceId: dto.referenceId || null,
                salesOrderId: dto.salesOrderId || null,
                purchaseOrderId: dto.purchaseOrderId || null,
              },
              tx,
            );

            if (!primaryMovementResult) {
              primaryMovementResult = movementRecord;
            }

            currentProductStockSnapshot = nextProductStock;
            remainingToDeduct = remainingToDeduct.sub(qtyFromThisBatch);
          }

          // Atualiza saldo geral do produto no catálogo
          await this.stockRepository.updateProductStock(product.id, newStock, tx);

          return primaryMovementResult;
        }
      }

      // ==========================================
      // CASO B: PRODUTO SEM CONTROLE DE LOTE
      // ==========================================
      await this.stockRepository.updateProductStock(product.id, newStock, tx);

      return this.stockRepository.createStockMovement(
        {
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
          referenceType: dto.referenceType || StockReferenceType.MANUAL,
          referenceId: dto.referenceId || null,
          salesOrderId: dto.salesOrderId || null,
          purchaseOrderId: dto.purchaseOrderId || null,
        },
        tx,
      );
    });
  }

  /**
   * Alias de compatibilidade para baixas manuais
   */
  async createManualMovement(dto: CreateStockMovementDto) {
    return this.createMovement(dto);
  }

  /**
   * Consulta histórico auditável com filtros e paginação
   */
  async getMovements(filters: StockMovementQueryDto) {
    const tenantId = TenantContextService.getTenantId();
    return this.stockRepository.findMovementsPaginated(tenantId, filters);
  }

  /**
   * Cadastro manual de lote para controle prévio de matéria-prima
   */
  async createBatch(dto: CreateProductBatchDto) {
    const tenantId = TenantContextService.getTenantId();
    const productId = dto.productId || dto.product_id;
    const batchCode = (dto.batchCode || dto.batch_code || '').trim();

    if (!productId) {
      throw new BadRequestException('O ID do produto (productId) é obrigatório.');
    }

    if (!batchCode) {
      throw new BadRequestException('O código do lote (batchCode) é obrigatório.');
    }

    const product = await this.stockRepository.findProductById(productId, tenantId);

    if (!product) {
      throw new NotFoundException(`Produto com ID "${productId}" não encontrado.`);
    }

    const existingBatch = await this.stockRepository.findBatchByCode(productId, batchCode, tenantId);

    if (existingBatch) {
      throw new ConflictException(`O lote "${batchCode}" já está cadastrado para este produto.`);
    }

    const expirationDate = dto.expirationDate || dto.expiration_date
      ? new Date(dto.expirationDate || dto.expiration_date!)
      : null;

    return this.stockRepository.createBatch({
      tenantId,
      productId,
      batchCode,
      expirationDate,
      quantity: new Prisma.Decimal(dto.initialQuantity || dto.initial_quantity || 0),
    });
  }

  /**
   * Consulta lotes ativos e validades de um produto (GET /stock/products/:id/batches)
   * Inclui cálculo de dias para vencimento e status semafórico (VALID, EXPIRING_SOON, EXPIRED).
   */
  async getProductBatches(productId: string): Promise<ProductBatchResponseDto[]> {
    const tenantId = TenantContextService.getTenantId();

    const product = await this.stockRepository.findProductById(productId, tenantId);
    if (!product) {
      throw new NotFoundException(`Produto com ID "${productId}" não encontrado.`);
    }

    const batches = await this.stockRepository.findBatchesByProductId(productId, tenantId);
    const now = new Date();

    return batches.map((b: any) => {
      let daysUntilExpiration: number | null = null;
      let status: BatchExpirationStatus = 'NO_EXPIRY';

      if (b.expirationDate) {
        const exp = new Date(b.expirationDate);
        const diffTime = exp.getTime() - now.getTime();
        daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysUntilExpiration < 0) {
          status = 'EXPIRED';
        } else if (daysUntilExpiration <= 30) {
          status = 'EXPIRING_SOON';
        } else {
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
}
