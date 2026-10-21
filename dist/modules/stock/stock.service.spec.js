"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const stock_service_1 = require("./stock.service");
const tenant_context_service_1 = require("../../common/multitenancy/tenant-context.service");
const domain_enums_1 = require("../../common/enums/domain.enums");
const client_1 = require("@prisma/client");
describe('StockService - Motor de Movimentações e Regras de Negócio', () => {
    let service;
    let mockPrisma;
    let mockRepo;
    const mockTenantId = 'tenant-123';
    const mockUserId = 'user-456';
    beforeEach(() => {
        jest.spyOn(tenant_context_service_1.TenantContextService, 'getTenantId').mockReturnValue(mockTenantId);
        jest.spyOn(tenant_context_service_1.TenantContextService, 'getUserId').mockReturnValue(mockUserId);
        mockPrisma = {
            $transaction: jest.fn(async (cb) => cb({})),
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
        service = new stock_service_1.StockService(mockPrisma, mockRepo);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('1. Validação de Justificativa Obrigatória', () => {
        it('deve lançar BadRequestException se o movimento 501 (Perda) não contiver reason', async () => {
            await expect(service.createMovement({
                productId: 'prod-1',
                movementTypeCode: '501',
                quantity: 1.5,
                reason: '   ',
            })).rejects.toThrow(common_1.BadRequestException);
        });
        it('deve lançar BadRequestException se o movimento 202 (Estorno Produção) não contiver reason', async () => {
            await expect(service.createMovement({
                productId: 'prod-1',
                movementTypeCode: '202',
                quantity: 2.0,
                reason: '',
            })).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('2. Validação de Estoque Negativo', () => {
        it('deve barrar saída (201) se a quantidade solicitada for maior que o saldo do produto', async () => {
            mockRepo.findProductById.mockResolvedValue({
                id: 'prod-1',
                name: 'Filamento PLA',
                type: domain_enums_1.ProductType.PRODUCT,
                unitOfMeasure: domain_enums_1.UnitOfMeasure.KG,
                stockQuantity: new client_1.Prisma.Decimal(5.0),
                costPrice: new client_1.Prisma.Decimal(80.0),
                isBatchControlled: false,
            });
            mockRepo.findMovementType.mockResolvedValue({
                code: '201',
                description: 'Consumo por Produção',
                direction: 'OUT',
            });
            await expect(service.createMovement({
                productId: 'prod-1',
                movementTypeCode: '201',
                quantity: 10.0,
            })).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('3. Cálculo de Saldo (101 Entrada vs 201 Saída)', () => {
        it('deve incrementar saldo do produto no movimento 101 (Entrada)', async () => {
            mockRepo.findProductById.mockResolvedValue({
                id: 'prod-1',
                name: 'Cabo de Rede',
                type: domain_enums_1.ProductType.PRODUCT,
                unitOfMeasure: domain_enums_1.UnitOfMeasure.UN,
                stockQuantity: new client_1.Prisma.Decimal(10.0),
                costPrice: new client_1.Prisma.Decimal(50.0),
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
            expect(mockRepo.updateProductStock).toHaveBeenCalledWith('prod-1', expect.objectContaining({ s: 1, e: 1, d: [15] }), expect.anything());
        });
    });
    describe('4. Sugestão PEPS/FIFO (FEFO) para Produtos Controlados por Lote', () => {
        it('deve baixar prioritariamente no lote com expiration_date mais próxima quando batchId não for informado', async () => {
            mockRepo.findProductById.mockResolvedValue({
                id: 'prod-resina',
                name: 'Resina UV 3D',
                type: domain_enums_1.ProductType.PRODUCT,
                unitOfMeasure: domain_enums_1.UnitOfMeasure.L,
                stockQuantity: new client_1.Prisma.Decimal(10.0),
                costPrice: new client_1.Prisma.Decimal(120.0),
                isBatchControlled: true,
            });
            mockRepo.findMovementType.mockResolvedValue({
                code: '201',
                description: 'Consumo por Produção',
                direction: 'OUT',
            });
            const batchA = {
                id: 'batch-a',
                batchCode: 'LOT-A-2026-11',
                expirationDate: new Date('2026-11-01'),
                quantity: new client_1.Prisma.Decimal(3.0),
            };
            const batchB = {
                id: 'batch-b',
                batchCode: 'LOT-B-2027-04',
                expirationDate: new Date('2027-04-01'),
                quantity: new client_1.Prisma.Decimal(7.0),
            };
            mockRepo.findActiveBatchesFifo.mockResolvedValue([batchA, batchB]);
            mockRepo.createStockMovement.mockResolvedValue({ id: 'sm-fifo-1' });
            await service.createMovement({
                productId: 'prod-resina',
                movementTypeCode: '201',
                quantity: 2.0,
            });
            expect(mockRepo.updateBatchQuantity).toHaveBeenCalledWith('batch-a', expect.objectContaining({ s: 1, e: 0, d: [1] }), expect.anything());
        });
    });
});
//# sourceMappingURL=stock.service.spec.js.map