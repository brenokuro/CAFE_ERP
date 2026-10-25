// src/modules/banking/banking.controller.ts
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
import { BankingService } from './banking.service';
import {
  CreateBankAccountDto,
  CreateBankTransactionDto,
} from './dto/create-bank-account.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CenterAccessGuard, Roles, RolesGuard } from '../../common/guards/access-control';
import { UserRole } from '../../common/enums/domain.enums';

@Controller('banking')
@UseGuards(JwtAuthGuard, CenterAccessGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.FINANCIAL)
export class BankingController {
  constructor(private readonly bankingService: BankingService) {}

  @Post('accounts')
  @HttpCode(HttpStatus.CREATED)
  async createAccount(@Body() dto: CreateBankAccountDto) {
    return this.bankingService.createAccount(dto);
  }

  @Get('accounts')
  async findAllAccounts() {
    return this.bankingService.findAllAccounts();
  }

  @Post('transactions')
  @HttpCode(HttpStatus.CREATED)
  async createTransaction(@Body() dto: CreateBankTransactionDto) {
    return this.bankingService.createTransaction(dto);
  }

  @Get('accounts/:id/transactions')
  async findTransactions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('reconciled') reconciled?: string,
  ) {
    return this.bankingService.findTransactions(
      id,
      reconciled !== undefined ? reconciled === 'true' : undefined,
    );
  }
}
