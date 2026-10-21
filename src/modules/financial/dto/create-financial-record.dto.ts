// src/modules/financial/dto/create-financial-record.dto.ts
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AccountCategoryType,
  FinancialRecordStatus,
  FinancialRecordType,
} from '../../../common/enums/domain.enums';

export class CreateChartOfAccountDto {
  @IsString()
  @IsNotEmpty()
  code: string; // ex: "1.01.001"

  @IsString()
  @IsNotEmpty()
  name: string; // ex: "Receita com Vendas de Produtos"

  @IsEnum(AccountCategoryType)
  type: AccountCategoryType;

  @IsUUID()
  @IsOptional()
  parentId?: string;
}

export class CreateFinancialRecordDto {
  @IsEnum(FinancialRecordType)
  type: FinancialRecordType; // RECEIVABLE (Receber) ou PAYABLE (Pagar)

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsUUID()
  @IsOptional()
  contactId?: string; // Cliente ou Fornecedor

  @IsUUID()
  @IsOptional()
  chartOfAccountId?: string; // Plano de contas / Categoria

  @IsDateString()
  @IsNotEmpty()
  dueDate: string; // Vencimento

  @IsDateString()
  @IsOptional()
  issueDate?: string; // Emissão

  @IsDateString()
  @IsOptional()
  competencyDate?: string; // Competência (DRE)

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  originalAmount: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  installmentNumber?: number = 1;

  @IsInt()
  @Min(1)
  @IsOptional()
  totalInstallments?: number = 1;

  @IsUUID()
  @IsOptional()
  salesOrderId?: string;

  @IsUUID()
  @IsOptional()
  purchaseOrderId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class SettleFinancialRecordDto {
  @IsUUID()
  @IsNotEmpty()
  bankAccountId: string; // Conta bancária de onde saiu ou entrou o dinheiro

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amountPaid: number; // Valor amortizado/liquidado

  @IsDateString()
  @IsNotEmpty()
  paymentDate: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  discountApplied?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  fineApplied?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  interestApplied?: number = 0;

  @IsString()
  @IsOptional()
  externalReferenceId?: string; // ID da transação PIX ou comprovante bancário
}
