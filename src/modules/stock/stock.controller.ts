// src/modules/stock/stock.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StockService } from './stock.service';
import {
  CreateStockMovementDto,
  StockMovementQueryDto,
} from './dto/create-stock-movement.dto';
import { CreateProductBatchDto } from './dto/create-batch.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  /**
   * POST /stock/movements
   * Lança uma movimentação avulsa de estoque com garantia transacional ACID.
   * Suporta Tipos de Movimento padronizados (101, 201, 202, 301, 501, 502, 601, 602),
   * validação de estoque negativo, justificativa obrigatória e critério PEPS/FIFO para lotes.
   */
  @Post('movements')
  @HttpCode(HttpStatus.CREATED)
  async createMovement(@Body() dto: CreateStockMovementDto) {
    return this.stockService.createMovement(dto);
  }

  /**
   * POST /stock/adjustments
   * Alias para baixas/ajustes de estoque
   */
  @Post('adjustments')
  @HttpCode(HttpStatus.CREATED)
  async createManualAdjustment(@Body() dto: CreateStockMovementDto) {
    return this.stockService.createMovement(dto);
  }

  /**
   * GET /stock/movements
   * Listagem paginada e auditável do histórico de movimentações com filtros por:
   * - product_id / productId
   * - movement_type_code / movementTypeCode
   * - user_id / userId
   * - batch_id / batchId
   * - start_date / startDate e end_date / endDate
   * - page e limit
   */
  @Get('movements')
  async getMovements(@Query() query: StockMovementQueryDto) {
    return this.stockService.getMovements(query);
  }

  /**
   * GET /stock/products/:id/batches
   * Lista os lotes ativos, saldos parciais e validades de um produto/insumo,
   * incluindo dias restantes para o vencimento e status (VALID, EXPIRING_SOON, EXPIRED).
   */
  @Get('products/:id/batches')
  async getProductBatches(@Param('id') productId: string) {
    return this.stockService.getProductBatches(productId);
  }

  /**
   * POST /stock/batches
   * Cadastro avulso de lote e validade para matéria-prima
   */
  @Post('batches')
  @HttpCode(HttpStatus.CREATED)
  async createBatch(@Body() dto: CreateProductBatchDto) {
    return this.stockService.createBatch(dto);
  }
}
