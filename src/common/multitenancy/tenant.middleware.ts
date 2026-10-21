// src/common/multitenancy/tenant.middleware.ts
import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContextService } from './tenant-context.service';

export interface AuthenticatedUserPayload {
  sub: string;       // ID do Usuário
  tenantId: string;  // ID do Tenant / Empresa
  role: string;      // Perfil de Acesso
  email: string;
}

declare global {
  namespace Express {
    interface User extends AuthenticatedUserPayload {}
    interface Request {
      tenantId?: string;
    }
  }
}

/**
 * Middleware para capturar o contexto do Tenant.
 * Pode extrair o Tenant a partir de:
 * 1. Claims do Token JWT decodificado (Padrão mais seguro)
 * 2. Header customizado `X-Tenant-ID` (Validando se o usuário possui acesso a esse tenant)
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = req.user;
    const headerTenantId = req.headers['x-tenant-id'] as string;

    const tenantId = user?.tenantId || headerTenantId;

    if (!tenantId) {
      // Para rotas públicas (ex: /auth/login, /health), prossegue sem tenant context
      return next();
    }

    req.tenantId = tenantId;

    // Envolve a execução no AsyncLocalStorage
    TenantContextService.runWithContext(
      {
        tenantId,
        userId: user?.sub || 'anonymous',
        userRole: user?.role || 'GUEST',
      },
      () => next(),
    );
  }
}
