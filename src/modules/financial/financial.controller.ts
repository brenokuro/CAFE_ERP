// src/modules/financial/financial.controller.ts
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
import { FinancialService } from './financial.service';
import {
  CreateFinancialRecordDto,
  SettleFinancialRecordDto,
} from './dto/create-financial-record.dto';
import { ReconcileTransactionDto } from '../banking/dto/create-bank-account.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  FinancialRecordStatus,
  FinancialRecordType,
} from '../../common/enums/domain.enums';

@Controller('financial')
@UseGuards(JwtAuthGuard)
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  /**
   * Endpoint de Fluxo de Caixa Consolidado e Projetado:
   * GET /financial/cash-flow
   * Retorna receitas, despesas, saldo de contas bancárias e projeção cronológica.
   */
  @Get('cash-flow')
  async getCashFlow(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financialService.getCashFlow({ startDate, endDate });
  }

  /**
   * Endpoint de Conciliação Bancária:
   * POST /financial/reconcile
   * Vincula transação bancária a um título financeiro, abatendo saldo e atualizando status.
   */
  @Post('reconcile')
  @HttpCode(HttpStatus.OK)
  async reconcile(@Body() dto: ReconcileTransactionDto) {
    return this.financialService.reconcile(dto);
  }

  /**
   * Criação de Título Financeiro avulso (Conta a Pagar / Receber):
   * POST /financial/records
   */
  @Post('records')
  @HttpCode(HttpStatus.CREATED)
  async createRecord(@Body() dto: CreateFinancialRecordDto) {
    return this.financialService.createRecord(dto);
  }

  /**
   * Baixa manual de título com lançamento bancário:
   * POST /financial/records/:id/settle
   */
  @Post('records/:id/settle')
  @HttpCode(HttpStatus.OK)
  async settleRecord(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SettleFinancialRecordDto,
  ) {
    return this.financialService.settleRecord(id, dto);
  }

  /**
   * Listagem de Títulos Financeiros com filtros:
   * GET /financial/records
   */
  @Get('records')
  async findAllRecords(
    @Query('type') type?: FinancialRecordType,
    @Query('status') status?: FinancialRecordStatus,
    @Query('contactId') contactId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financialService.findAllRecords({
      type,
      status,
      contactId,
      startDate,
      endDate,
    });
  }

  /**
   * Detalhes de um título financeiro:
   * GET /financial/records/:id
   */
  @Get('records/:id')
  async findOneRecord(@Param('id', ParseUUIDPipe) id: string) {
    return this.financialService.findOneRecord(id);
  }
}
