// src/modules/products/dto/create-product.dto.ts
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductType, UnitOfMeasure } from '../../../common/enums/domain.enums';

export class CreateProductDto {
  @IsEnum(ProductType, {
    message: 'O tipo do produto deve ser PRODUCT (físico) ou SERVICE (serviço).',
  })
  type: ProductType;

  @IsString()
  @IsNotEmpty({ message: 'O código SKU/Referência é obrigatório.' })
  sku: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsNotEmpty({ message: 'O nome do produto/insumo é obrigatório.' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(UnitOfMeasure, {
    message: 'A unidade de medida deve ser uma das opções padrão: UN, KG, G, L, ML ou M.',
  })
  @IsOptional()
  unitOfMeasure?: UnitOfMeasure = UnitOfMeasure.UN;

  @IsString()
  @IsOptional()
  unit?: string = 'UN'; // Compatibilidade retroativa

  @IsBoolean({ message: 'O controle de lote deve ser verdadeiro ou falso.' })
  @IsOptional()
  isBatchControlled?: boolean = false;

  // Precificação e Estoque com validação estrita de até 4 casas decimais
  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: 'O preço de venda deve ser um número válido com no máximo 4 casas decimais.' },
  )
  @IsPositive({ message: 'O preço de venda deve ser maior que zero.' })
  @Type(() => Number)
  salePrice: number;

  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: 'O preço de custo deve ser um número com no máximo 4 casas decimais.' },
  )
  @Min(0, { message: 'O preço de custo não pode ser negativo.' })
  @IsOptional()
  @Type(() => Number)
  costPrice?: number = 0;

  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: 'O estoque mínimo aceita valores fracionados com até 4 casas decimais.' },
  )
  @Min(0, { message: 'O estoque mínimo não pode ser negativo.' })
  @IsOptional()
  @Type(() => Number)
  minStock?: number = 0;

  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: 'O saldo inicial aceita insumos fracionados com precisão de até 4 casas decimais (ex: 2.7500 kg).' },
  )
  @Min(0, { message: 'O saldo inicial não pode ser negativo.' })
  @IsOptional()
  @Type(() => Number)
  initialStock?: number = 0;

  // Dados do lote inicial (caso o produto seja controlado por lote e tenha saldo inicial)
  @ValidateIf((o) => o.isBatchControlled && o.initialStock > 0)
  @IsString({ message: 'O código do lote é obrigatório quando há saldo inicial em produto com controle de lote.' })
  @IsNotEmpty({ message: 'Informe o código do lote inicial.' })
  @IsOptional()
  initialBatchCode?: string;

  @ValidateIf((o) => o.isBatchControlled && o.initialStock > 0)
  @IsDateString({}, { message: 'A data de validade do lote inicial deve estar no formato ISO (YYYY-MM-DD).' })
  @IsOptional()
  initialBatchExpiration?: string;

  // Informações Fiscais Básicas
  @IsString()
  @IsOptional()
  ncm?: string;

  @IsString()
  @IsOptional()
  nbs?: string;

  @IsString()
  @IsOptional()
  cest?: string;

  @IsString()
  @IsOptional()
  cfopDefault?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean = true;
}
