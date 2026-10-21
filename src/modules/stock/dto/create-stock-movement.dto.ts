// src/modules/stock/dto/create-stock-movement.dto.ts
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
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { MovementTypeCode, StockReferenceType } from '../../../common/enums/domain.enums';

/**
 * DTO para lançamento de movimentação de estoque avulsa (POST /stock/movements).
 * Suporta alta precisão (Decimal 12,4), lotes, rastreabilidade e compatibilidade snake_case / camelCase.
 */
export class CreateStockMovementDto {
  @IsUUID('4', { message: 'O ID do produto (productId) deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'O ID do produto (productId) é obrigatório.' })
  @Transform(({ value, obj }) => value || obj.product_id)
  productId: string;

  // Suporte a product_id no payload
  @IsOptional()
  product_id?: string;

  @IsEnum(MovementTypeCode, {
    message:
      'Código de movimento inválido. Utilize um código padronizado: 101 (Entrada Compra), 201 (Consumo Produção/Uso Interno), 202 (Estorno Produção), 301 (Transferência), 501 (Baixa Perda/Avaria/Validade), 502 (Estorno Perda), 601 (Saída Venda), 602 (Devolução Venda).',
  })
  @IsNotEmpty({ message: 'O código do tipo de movimento (movementTypeCode) é obrigatório.' })
  @Transform(({ value, obj }) => String(value || obj.movement_type_code || ''))
  movementTypeCode: MovementTypeCode | string;

  // Suporte a movement_type_code no payload
  @IsOptional()
  movement_type_code?: string;

  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: 'A quantidade (quantity) aceita frações com até 4 casas decimais (ex: 0.3500 kg, 1.2500 L).' },
  )
  @IsPositive({ message: 'A quantidade movimentada (quantity) deve ser estritamente maior que zero.' })
  @Type(() => Number)
  quantity: number;

  @IsUUID('4', { message: 'O ID do lote (batchId) deve ser um UUID válido.' })
  @IsOptional()
  @Transform(({ value, obj }) => value || obj.batch_id)
  batchId?: string;

  // Suporte a batch_id no payload
  @IsOptional()
  batch_id?: string;

  @IsString({ message: 'O código do lote (batchCode) deve ser um texto.' })
  @IsOptional()
  @Transform(({ value, obj }) => value || obj.batch_code)
  batchCode?: string;

  @IsOptional()
  batch_code?: string;

  @IsDateString({}, { message: 'A data de validade (expirationDate) deve estar no formato ISO YYYY-MM-DD.' })
  @IsOptional()
  @Transform(({ value, obj }) => value || obj.expiration_date)
  expirationDate?: string;

  @IsOptional()
  expiration_date?: string;

  @IsString({ message: 'O número do documento (documentNumber) deve ser uma string identificadora.' })
  @IsOptional()
  @Transform(({ value, obj }) => value || obj.document_number)
  documentNumber?: string;

  @IsOptional()
  document_number?: string;

  // Justificativa OBRIGATÓRIA para movimentos de perda (501) e estornos (202, 502)
  @ValidateIf((o) => {
    const code = String(o.movementTypeCode || o.movement_type_code || '');
    return [
      MovementTypeCode.OUT_LOSS,
      MovementTypeCode.IN_LOSS_REV,
      MovementTypeCode.IN_PRODUCTION_REV,
      '501',
      '502',
      '202',
    ].includes(code as any);
  })
  @IsString({ message: 'A justificativa (reason) deve ser um texto descritivo.' })
  @IsNotEmpty({
    message:
      'A justificativa (reason) é estritamente obrigatória para movimentações de perda/avaria/validade (501) ou estornos (202, 502). Ex: "Filamento úmido / insumo vencido".',
  })
  reason?: string;

  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: 'O custo unitário (unitCost) deve ter no máximo 4 casas decimais.' },
  )
  @Min(0, { message: 'O custo unitário não pode ser negativo.' })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value, obj }) => (value !== undefined ? value : obj.unit_cost))
  unitCost?: number;

  @IsOptional()
  unit_cost?: number;

  @IsEnum(StockReferenceType)
  @IsOptional()
  referenceType?: StockReferenceType;

  @IsString()
  @IsOptional()
  referenceId?: string;

  @IsUUID('4')
  @IsOptional()
  salesOrderId?: string;

  @IsUUID('4')
  @IsOptional()
  purchaseOrderId?: string;
}

export class CreateManualStockMovementDto extends CreateStockMovementDto {}

/**
 * Filtros de busca paginada para o histórico auditável de estoque (GET /stock/movements).
 */
export class StockMovementQueryDto {
  @IsUUID('4', { message: 'O filtro productId deve ser um UUID válido.' })
  @IsOptional()
  @Transform(({ value, obj }) => value || obj.product_id)
  productId?: string;

  @IsOptional()
  product_id?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value, obj }) => value || obj.movement_type_code)
  movementTypeCode?: string;

  @IsOptional()
  movement_type_code?: string;

  @IsUUID('4', { message: 'O filtro userId deve ser um UUID válido.' })
  @IsOptional()
  @Transform(({ value, obj }) => value || obj.user_id)
  userId?: string;

  @IsOptional()
  user_id?: string;

  @IsUUID('4')
  @IsOptional()
  @Transform(({ value, obj }) => value || obj.batch_id)
  batchId?: string;

  @IsOptional()
  batch_id?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value, obj }) => value || obj.document_number)
  documentNumber?: string;

  @IsOptional()
  document_number?: string;

  @IsDateString({}, { message: 'A data inicial (startDate) deve ser uma data válida ISO 8601.' })
  @IsOptional()
  @Transform(({ value, obj }) => value || obj.start_date)
  startDate?: string;

  @IsOptional()
  start_date?: string;

  @IsDateString({}, { message: 'A data final (endDate) deve ser uma data válida ISO 8601.' })
  @IsOptional()
  @Transform(({ value, obj }) => value || obj.end_date)
  endDate?: string;

  @IsOptional()
  end_date?: string;

  @IsInt({ message: 'O número da página (page) deve ser um inteiro.' })
  @Min(1, { message: 'A página deve ser maior ou igual a 1.' })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsInt({ message: 'O limite por página (limit) deve ser um inteiro.' })
  @Min(1, { message: 'O limite mínimo por página é 1.' })
  @Max(100, { message: 'O limite máximo por página é 100.' })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

// Mantido alias para filtros
export class StockMovementFilterDto extends StockMovementQueryDto {}

export class PaginatedStockMovementResponseDto {
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
