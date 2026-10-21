// src/modules/products/dto/update-product.dto.ts
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductType, UnitOfMeasure } from '../../../common/enums/domain.enums';

export class UpdateProductDto {
  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(UnitOfMeasure, {
    message: 'A unidade de medida deve ser uma das opções padrão: UN, KG, G, L, ML ou M.',
  })
  @IsOptional()
  unitOfMeasure?: UnitOfMeasure;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsBoolean()
  @IsOptional()
  isBatchControlled?: boolean;

  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: 'O preço de venda deve ser um número válido com no máximo 4 casas decimais.' },
  )
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  salePrice?: number;

  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: 'O preço de custo deve ser um número com no máximo 4 casas decimais.' },
  )
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  costPrice?: number;

  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: 'O estoque mínimo aceita valores fracionados com até 4 casas decimais.' },
  )
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minStock?: number;

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
  active?: boolean;
}
