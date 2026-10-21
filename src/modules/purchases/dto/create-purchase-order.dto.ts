// src/modules/purchases/dto/create-purchase-order.dto.ts
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseOrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  unitCost: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  discount?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  otherExpenses?: number = 0;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreatePurchaseOrderDto {
  @IsUUID()
  @IsNotEmpty()
  supplierId: string;

  // Suporte a Nota Fiscal Eletrônica (NF-e)
  @IsString()
  @IsOptional()
  @Length(44, 44, { message: 'A chave de acesso da NF-e deve possuir exatamente 44 dígitos.' })
  @Matches(/^\d{44}$/, { message: 'A chave da NF-e deve ser composta apenas por dígitos numéricos.' })
  invoiceKey?: string;

  @IsString()
  @IsOptional()
  invoiceSeries?: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsString()
  @IsOptional()
  xmlUrl?: string;

  @IsDateString()
  @IsOptional()
  arrivalDate?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  totalDiscount?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  totalFreight?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  totalOtherExpenses?: number = 0;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  receiveNow?: boolean = true; // Por padrão, já dá entrada imediata nas mercadorias

  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  installmentsCount?: number = 1;

  @IsDateString()
  @IsOptional()
  firstDueDate?: string;

  @IsUUID('4')
  @IsOptional()
  categoryAccountId?: string; // Categoria do Plano de Contas para Despesas de Insumos

  @IsArray()
  @ArrayMinSize(1, { message: 'O pedido de compra deve possuir ao menos 1 item.' })
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];
}
