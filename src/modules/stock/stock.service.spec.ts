// src/modules/stock/stock.service.spec.ts
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockRepository } from './stock.repository';
import { TenantContextService } from '../../common/multitenancy/tenant-context.service';
import { MovementTypeCode, ProductType, UnitOfMeasure } from '../../common/enums/domain.enums';
import { Prisma } from '@prisma/client';

describe('StockService - Motor de Movimentações e Regras de Negócio', () => {
  let service: StockService;
  let mockPrisma: any;
  let mockRepo: any;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-456';
  const mockCenterId = 'center-789';

  beforeEach(() => {
    jest.spyOn(TenantContextService, 'getTenantId').mockReturnValue(mockTenantId);
    jest.spyOn(TenantContextService, 'getUserId').mockReturnValue(mockUserId);
    jest.spyOn(TenantContextService, 'getCenterId').mockReturnValue(mockCenterId);

    mockPrisma = {
      $transaction: jest.fn(async (cb) => cb({
        centerStock: { findUnique: jest.fn().mockResolvedValue({ quantity: new Prisma.Decimal(5) }) },
      })),
    };

    mockRepo = {
      findProductById: jest.fn(),
      findMovementType: jest.fn(),
      findBatchById: jest.fn(),
      findBatchByCode: jest.fn(),
      findActiveBatchesFifo: jest.fn(),
      createBatch: jest.fn(),
      updateBatchQuantity: jest.fn(),
      updateProductStock: jest.fn(),
      createStockMovement: jest.fn(),
      findMovementsPaginated: jest.fn(),
      findBatchesByProductId: jest.fn(),
    };

    service = new StockService(mockPrisma, mockRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Validação de Justificativa Obrigatória', () => {
    it('deve lançar BadRequestException se o movimento 501 (Perda) não contiver reason', async () => {
      await expect(
        service.createMovement({
          productId: 'prod-1',
          movementTypeCode: '501',
          quantity: 1.5,
          reason: '   ',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se o movimento 202 (Estorno Produção) não contiver reason', async () => {
      await expect(
        service.createMovement({
          productId: 'prod-1',
          movementTypeCode: '202',
          quantity: 2.0,
          reason: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. Validação de Estoque Negativo', () => {
    it('deve barrar saída (201) se a quantidade solicitada for maior que o saldo do produto', async () => {
      mockRepo.findProductById.mockResolvedValue({
        id: 'prod-1',
        name: 'Filamento PLA',
        type: ProductType.PRODUCT,
        unitOfMeasure: UnitOfMeasure.KG,
        stockQuantity: new Prisma.Decimal(5.0),
        costPrice: new Prisma.Decimal(80.0),
        isBatchControlled: false,
      });

      mockRepo.findMovementType.mockResolvedValue({
        code: '201',
        description: 'Consumo por Produção',
        direction: 'OUT',
      });

      await expect(
        service.createMovement({
          productId: 'prod-1',
          movementTypeCode: '201',
          quantity: 10.0,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. Cálculo de Saldo (101 Entrada vs 201 Saída)', () => {
    it('deve incrementar saldo do produto no movimento 101 (Entrada)', async () => {
      mockRepo.findProductById.mockResolvedValue({
        id: 'prod-1',
        name: 'Cabo de Rede',
        type: ProductType.PRODUCT,
        unitOfMeasure: UnitOfMeasure.UN,
        stockQuantity: new Prisma.Decimal(10.0),
        costPrice: new Prisma.Decimal(50.0),
        isBatchControlled: false,
      });

      mockRepo.findMovementType.mockResolvedValue({
        code: '101',
        description: 'Entrada por Compra',
        direction: 'IN',
      });

      mockRepo.createStockMovement.mockResolvedValue({ id: 'sm-1', newStock: 15.0 });

      await service.createMovement({
        productId: 'prod-1',
        movementTypeCode: '101',
        quantity: 5.0,
      });

      const [updatedProductId, nextGlobalStock, nextCenterStock, tenantId, centerId] = mockRepo.updateProductStock.mock.calls[0];
      expect(updatedProductId).toBe('prod-1');
      expect(nextGlobalStock.toString()).toBe('15');
      expect(nextCenterStock.toString()).toBe('10');
      expect(tenantId).toBe(mockTenantId);
      expect(centerId).toBe(mockCenterId);
    });
  });

  describe('4. Sugestão PEPS/FIFO (FEFO) para Produtos Controlados por Lote', () => {
    it('deve baixar prioritariamente no lote com expiration_date mais próxima quando batchId não for informado', async () => {
      mockRepo.findProductById.mockResolvedValue({
        id: 'prod-resina',
        name: 'Resina UV 3D',
        type: ProductType.PRODUCT,
        unitOfMeasure: UnitOfMeasure.L,
        stockQuantity: new Prisma.Decimal(10.0),
        costPrice: new Prisma.Decimal(120.0),
        isBatchControlled: true,
      });

      mockRepo.findMovementType.mockResolvedValue({
        code: '201',
        description: 'Consumo por Produção',
        direction: 'OUT',
      });

      // Dois lotes ativos: lote-A vence em 2026-11, lote-B vence em 2027-04
      const batchA = {
        id: 'batch-a',
        batchCode: 'LOT-A-2026-11',
        expirationDate: new Date('2026-11-01'),
        quantity: new Prisma.Decimal(3.0),
      };
      const batchB = {
        id: 'batch-b',
        batchCode: 'LOT-B-2027-04',
        expirationDate: new Date('2027-04-01'),
        quantity: new Prisma.Decimal(7.0),
      };

      mockRepo.findActiveBatchesFifo.mockResolvedValue([batchA, batchB]);
      mockRepo.createStockMovement.mockResolvedValue({ id: 'sm-fifo-1' });

      // Consome 2.0 litros sem passar batchId
      await service.createMovement({
        productId: 'prod-resina',
        movementTypeCode: '201',
        quantity: 2.0,
      });

      // Deve ter deduzido de batch-a (vencimento mais próximo): 3.0 - 2.0 = 1.0
      expect(mockRepo.updateBatchQuantity).toHaveBeenCalledWith(
        'batch-a',
        expect.objectContaining({ s: 1, e: 0, d: [1] }),
        expect.anything(),
      );
    });
  });
});
