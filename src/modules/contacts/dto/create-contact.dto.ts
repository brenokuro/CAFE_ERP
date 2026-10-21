// src/modules/contacts/dto/create-contact.dto.ts
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContactRole, PersonType } from '../../../common/enums/domain.enums';

export class CreateContactDto {
  @IsEnum(PersonType)
  personType: PersonType;

  @IsEnum(ContactRole)
  role: ContactRole; // CUSTOMER, SUPPLIER ou BOTH

  @IsString()
  @IsNotEmpty()
  name: string; // Razão Social / Nome

  @IsString()
  @IsOptional()
  tradeName?: string; // Nome Fantasia

  @IsString()
  @IsOptional()
  document?: string; // CPF ou CNPJ

  @IsString()
  @IsOptional()
  stateRegistration?: string;

  @IsString()
  @IsOptional()
  municipalRegistration?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  mobile?: string;

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
  state?: string;

  @IsString()
  @IsOptional()
  zipCode?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  creditLimit?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean = true;
}
