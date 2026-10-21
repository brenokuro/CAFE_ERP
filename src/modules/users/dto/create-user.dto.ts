// src/modules/users/dto/create-user.dto.ts
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../../common/enums/domain.enums';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve conter no mínimo 8 caracteres.' })
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.OPERATOR;
}

export class UserResponseDto {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
}
