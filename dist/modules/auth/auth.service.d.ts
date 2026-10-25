import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/database/prisma.service';
import { AuthResponseDto, LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(dto: LoginDto): Promise<AuthResponseDto>;
    getCurrentUser(userId: string): Promise<{
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
