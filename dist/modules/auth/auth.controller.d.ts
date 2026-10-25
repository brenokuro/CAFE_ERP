import { AuthService } from './auth.service';
import { AuthResponseDto, LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<AuthResponseDto>;
    me(user: any): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            isPrimaryAdmin: boolean;
        };
        tenant: {
            id: string;
            name: string;
            document: string;
        };
        centers: {
            id: string;
            name: string;
            active: boolean;
        }[];
    }>;
}
