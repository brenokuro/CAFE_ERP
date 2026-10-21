// src/modules/sales/dto/create-sales-order.dto.ts
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
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSalesOrderItemDto {
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
  unitPrice: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  discount?: number = 0;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateSalesOrderDto {
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @IsDateString()
  @IsOptional()
  deliveryDate?: string;

  @IsString()
  @IsOptional()
  paymentTerm?: string; // ex: "30/60/90" ou "À vista - PIX"

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

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  approveNow?: boolean = true; // Por padrão, aprova e dispara efeito cascata se true

  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  installmentsCount?: number = 1; // Quantidade de parcelas a gerar no Contas a Receber

  @IsDateString()
  @IsOptional()
  firstDueDate?: string; // Data do 1º vencimento

  @IsUUID('4')
  @IsOptional()
  categoryAccountId?: string; // Categoria do Plano de Contas

  @IsArray()
  @ArrayMinSize(1, { message: 'O pedido de venda deve conter ao menos 1 item.' })
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderItemDto)
  items: CreateSalesOrderItemDto[];
}
