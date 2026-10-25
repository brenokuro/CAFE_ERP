// src/modules/auth/dto/login.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'O e-mail informado deve ser válido.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  password: string;

  @IsUUID('4', { message: 'O Tenant ID deve ser um UUID válido caso informado.' })
  @IsOptional()
  tenantId?: string;
}

export class AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isPrimaryAdmin: boolean;
  };
  tenant: {
    id: string;
    name: string;
    document: string;
  };
}
