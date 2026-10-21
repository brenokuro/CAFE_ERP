// src/modules/stock/dto/create-batch.dto.ts
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateProductBatchDto {
  @IsUUID('4', { message: 'O ID do produto (productId) deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'O ID do produto é obrigatório para cadastrar um lote.' })
  @Transform(({ value, obj }) => value || obj.product_id)
  productId: string;

  @IsOptional()
  product_id?: string;

  @IsString()
  @IsNotEmpty({ message: 'O código do lote (batchCode) é obrigatório (ex: "LOT-2026-A1").' })
  @Transform(({ value, obj }) => value || obj.batch_code)
  batchCode: string;

  @IsOptional()
  batch_code?: string;

  @IsDateString({}, { message: 'A data de validade (expirationDate) deve ser válida no formato YYYY-MM-DD.' })
  @IsOptional()
  @Transform(({ value, obj }) => value || obj.expiration_date)
  expirationDate?: string;

  @IsOptional()
  expiration_date?: string;

  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: 'A quantidade inicial do lote aceita até 4 casas decimais.' },
  )
  @Min(0, { message: 'A quantidade inicial do lote não pode ser negativa.' })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value, obj }) => (value !== undefined ? value : obj.initial_quantity))
  initialQuantity?: number = 0;

  @IsOptional()
  initial_quantity?: number;
}

export type BatchExpirationStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'NO_EXPIRY';

export class ProductBatchResponseDto {
  id: string;
  tenantId: string;
  productId: string;
  batchCode: string;
  expirationDate: Date | null;
  quantity: number;
  daysUntilExpiration?: number | null;
  status?: BatchExpirationStatus;
  createdAt: Date;
  updatedAt: Date;
}
