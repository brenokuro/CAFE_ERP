// src/modules/categories/dto/create-category.dto.ts
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { AccountCategoryType } from '../../../common/enums/domain.enums';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'O código estrutural da categoria é obrigatório (ex: 1.01.01).' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'O nome da categoria é obrigatório.' })
  name: string;

  @IsEnum(AccountCategoryType, {
    message: 'O tipo deve ser REVENUE (Receita), EXPENSE (Despesa), ASSET (Ativo) ou LIABILITY (Passivo).',
  })
  type: AccountCategoryType;

  @IsUUID('4', { message: 'O ID da categoria pai deve ser um UUID válido.' })
  @IsOptional()
  parentId?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean = true;
}

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(AccountCategoryType)
  @IsOptional()
  type?: AccountCategoryType;

  @IsUUID('4')
  @IsOptional()
  parentId?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
