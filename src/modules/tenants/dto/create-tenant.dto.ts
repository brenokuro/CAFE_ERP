// src/modules/tenants/dto/create-tenant.dto.ts
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';
import { TaxRegime } from '../../../common/enums/domain.enums';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Razão Social

  @IsString()
  @IsOptional()
  tradeName?: string; // Nome Fantasia

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{11}|\d{14}$/, {
    message: 'O documento do Tenant deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ), apenas números.',
  })
  document: string; // CNPJ ou CPF

  @IsString()
  @IsOptional()
  stateRegistration?: string; // Inscrição Estadual

  @IsString()
  @IsOptional()
  municipalRegistration?: string; // Inscrição Municipal

  @IsEnum(TaxRegime)
  taxRegime: TaxRegime;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  // Endereço
  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  number?: string;

  @IsString()
  @IsOptional()
  complement?: string;

  @IsString()
  @IsOptional()
  neighborhood?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  @Length(2, 2)
  state?: string; // UF

  @IsString()
  @IsOptional()
  zipCode?: string;

  @IsString()
  @IsOptional()
  ibgeCode?: string;
}
