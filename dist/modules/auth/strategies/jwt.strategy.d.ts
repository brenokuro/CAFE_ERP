import { Strategy } from 'passport-jwt';
import { PrismaService } from '../../../common/database/prisma.service';
export interface JwtPayload {
    sub: string;
    tenantId: string;
    email: string;
    role: string;
}
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly prisma;
    constructor(prisma: PrismaService);
    validate(payload: JwtPayload): Promise<{
        sub: string;
        tenantId: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        isPrimaryAdmin: boolean;
    }>;
}
export {};
