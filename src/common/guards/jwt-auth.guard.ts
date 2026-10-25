// src/common/guards/jwt-auth.guard.ts
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantContextService } from '../multitenancy/tenant-context.service';

/**
 * Guard para autenticação JWT e injeção do contexto de Tenant no AsyncLocalStorage.
 * Garante que qualquer requisição em rotas protegidas tenha um token válido
 * e configure transparentemente o TenantContextService.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const parentCanActivate = (await super.canActivate(context)) as boolean;
    if (!parentCanActivate) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.tenantId) {
      throw new UnauthorizedException('Token inválido: Tenant ID ausente nos claims.');
    }

    request.tenantId = user.tenantId;
    TenantContextService.setSession({
      tenantId: user.tenantId,
      userId: user.sub || user.userId,
      userRole: user.role,
      isPrimaryAdmin: user.isPrimaryAdmin,
    });

    return true;
  }
}
