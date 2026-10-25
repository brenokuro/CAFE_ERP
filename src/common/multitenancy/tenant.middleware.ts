// src/common/multitenancy/tenant.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
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
  use(_req: Request, _res: Response, next: NextFunction) {
    // Passport autentica depois do middleware. O guard preencherá a sessão
    // dentro deste mesmo contexto assíncrono após validar o JWT.
    TenantContextService.runWithContext(
      { tenantId: '', userId: 'anonymous', userRole: 'GUEST' },
      () => next(),
    );
  }
}
