// src/modules/purchases/purchases.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PurchaseOrderStatus } from '../../common/enums/domain.enums';
import { CenterAccessGuard, Roles, RolesGuard } from '../../common/guards/access-control';
import { UserRole } from '../../common/enums/domain.enums';

@Controller('purchases')
@UseGuards(JwtAuthGuard, CenterAccessGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PURCHASING)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  /**
   * Endpoint de Compra:
   * POST /purchases
   * Registra a compra e, se receiveNow for verdadeiro (padrão),
   * dá entrada no estoque, recalcula o custo médio ponderado e gera o Contas a Pagar.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPurchase(@Body() dto: CreatePurchaseOrderDto) {
    return this.purchasesService.createPurchase(dto);
  }

  /**
   * Entrada de mercadoria para uma compra existente em cotação/rascunho:
   * POST /purchases/:id/receive
   */
  @Post(':id/receive')
  @HttpCode(HttpStatus.OK)
  async receivePurchaseOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body?: {
      installmentsCount?: number;
      firstDueDate?: string;
      categoryAccountId?: string;
    },
  ) {
    return this.purchasesService.receivePurchaseOrder(id, body);
  }

  /**
   * Listagem de compras com filtro por status:
   * GET /purchases
   */
  @Get()
  async findAll(@Query('status') status?: PurchaseOrderStatus) {
    return this.purchasesService.findAll(status);
  }

  /**
   * Detalhes de uma compra com histórico de estoque e parcelas a pagar:
   * GET /purchases/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchasesService.findOne(id);
  }
}
