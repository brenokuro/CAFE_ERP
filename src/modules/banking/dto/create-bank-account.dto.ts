// src/modules/banking/dto/create-bank-account.dto.ts
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BankAccountType, BankTransactionType } from '../../../common/enums/domain.enums';

export class CreateBankAccountDto {
  @IsString()
  @IsNotEmpty()
  name: string; // ex: "Itaú Empresas - CC", "Caixa Loja 1"

  @IsString()
  @IsOptional()
  bankCode?: string; // Código FEBRABAN (ex: "341")

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  agency?: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsEnum(BankAccountType)
  accountType: BankAccountType;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  initialBalance?: number = 0;

  @IsBoolean()
  @IsOptional()
  active?: boolean = true;
}

export class CreateBankTransactionDto {
  @IsUUID()
  @IsNotEmpty()
  bankAccountId: string;

  @IsEnum(BankTransactionType)
  type: BankTransactionType; // CREDIT ou DEBIT

  @IsNumber()
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsNotEmpty()
  transactionDate: string; // YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsUUID()
  @IsOptional()
  financialRecordId?: string; // Vínculo com título

  @IsString()
  @IsOptional()
  externalReferenceId?: string; // OFX FITID, PIX EndToEndId
}

export class ReconcileTransactionDto {
  @IsUUID()
  @IsNotEmpty()
  bankTransactionId: string;

  @IsUUID()
  @IsNotEmpty()
  financialRecordId: string;
}
