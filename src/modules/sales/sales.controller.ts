// src/modules/sales/sales.controller.ts
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
import { SalesService } from './sales.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SalesOrderStatus } from '../../common/enums/domain.enums';
import { CenterAccessGuard, Roles, RolesGuard } from '../../common/guards/access-control';
import { UserRole } from '../../common/enums/domain.enums';

@Controller('sales')
@UseGuards(JwtAuthGuard, CenterAccessGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  /**
   * Endpoint de Venda:
   * POST /sales
   * Cria a venda e, se approveNow for verdadeiro (padrão), já executa
   * a validação de estoque, baixa e geração de Contas a Receber.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() dto: CreateSalesOrderDto) {
    return this.salesService.createOrder(dto);
  }

  /**
   * Faturamento de uma venda existente em rascunho:
   * POST /sales/:id/invoice
   */
  @Post(':id/invoice')
  @HttpCode(HttpStatus.OK)
  async invoiceOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body?: {
      installmentsCount?: number;
      firstDueDate?: string;
      categoryAccountId?: string;
    },
  ) {
    return this.salesService.invoiceOrder(id, body);
  }

  /**
   * Listagem de vendas com filtro por status:
   * GET /sales
   */
  @Get()
  async findAll(@Query('status') status?: SalesOrderStatus) {
    return this.salesService.findAll(status);
  }

  /**
   * Detalhes de uma venda com rastreabilidade completa:
   * GET /sales/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.findOne(id);
  }
}
