// src/modules/auth/dto/register.dto.ts
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { TaxRegime } from '../../../common/enums/domain.enums';

export class RegisterDto {
  // Dados da Empresa (Tenant)
  @IsString()
  @IsNotEmpty({ message: 'A Razão Social da empresa é obrigatória.' })
  companyName: string;

  @IsString()
  @IsOptional()
  companyTradeName?: string;

  @IsString()
  @IsNotEmpty({ message: 'O CNPJ/CPF da empresa é obrigatório.' })
  @Matches(/^\d{11}|\d{14}$/, {
    message: 'O documento da empresa deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ), apenas números.',
  })
  companyDocument: string;

  @IsEnum(TaxRegime, { message: 'Regime tributário inválido.' })
  taxRegime: TaxRegime;

  @IsEmail({}, { message: 'O e-mail da empresa deve ser válido.' })
  companyEmail: string;

  @IsString()
  @IsOptional()
  companyPhone?: string;

  // Dados do Administrador Inicial
  @IsString()
  @IsNotEmpty({ message: 'O nome do usuário administrador é obrigatório.' })
  adminName: string;

  @IsEmail({}, { message: 'O e-mail do usuário administrador deve ser válido.' })
  adminEmail: string;

  @IsString()
  @MinLength(8, { message: 'A senha do usuário deve conter no mínimo 8 caracteres.' })
  adminPassword: string;
}
