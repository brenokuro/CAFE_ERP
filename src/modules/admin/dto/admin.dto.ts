import { IsArray, IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { UserRole } from '../../../common/enums/domain.enums';

export class CreateManagedUserDto {
  @IsString() @IsNotEmpty() name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(12) password: string;
  @IsEnum(UserRole) role: UserRole;
  @IsArray() @IsUUID('4', { each: true }) centerIds: string[];
}

export class UpdateUserStatusDto {
  @IsBoolean() active: boolean;
}

export class UpdateUserAccessDto {
  @IsEnum(UserRole) role: UserRole;
  @IsArray() @IsUUID('4', { each: true }) centerIds: string[];
}

export class CreateCenterDto {
  @IsString() @IsNotEmpty() name: string;
}

export class UpdateCenterDto {
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class AssignLegacyRecordDto {
  @IsUUID('4') centerId: string;
}
