import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedUserPayload {
    sub: string;
    tenantId: string;
    role: string;
    email: string;
}
declare global {
    namespace Express {
        interface User extends AuthenticatedUserPayload {
        }
        interface Request {
            tenantId?: string;
        }
    }
}
export declare class TenantMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void;
}
