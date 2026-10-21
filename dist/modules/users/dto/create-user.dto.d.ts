import { UserRole } from '../../../common/enums/domain.enums';
export declare class CreateUserDto {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
}
export declare class UserResponseDto {
    id: string;
    tenantId: string;
    name: string;
    email: string;
    role: UserRole;
    active: boolean;
    createdAt: Date;
}
