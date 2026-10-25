import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../database/prisma.service';
import { TenantContextService } from '../multitenancy/tenant-context.service';
import { UserRole } from '../enums/domain.enums';

const REQUIRED_ROLES = 'required_roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(REQUIRED_ROLES, roles);
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) =>
  context.switchToHttp().getRequest().user,
);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (request.user?.isPrimaryAdmin) return true;
    const roles = this.reflector.getAllAndOverride<UserRole[]>(REQUIRED_ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length || !roles.includes(request.user?.role)) {
      throw new ForbiddenException('Seu perfil não permite esta operação.');
    }
    return true;
  }
}

@Injectable()
export class PrincipalAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;
    if (!user?.isPrimaryAdmin) {
      throw new ForbiddenException('Apenas o administrador principal pode executar esta ação.');
    }
    return true;
  }
}

@Injectable()
export class CenterAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.tenantId || !user?.sub) throw new UnauthorizedException();

    const selectedCenter = request.headers['x-center-id'];
    if (typeof selectedCenter !== 'string' || !selectedCenter) {
      throw new ForbiddenException('Selecione um centro autorizado para continuar.');
    }

    const bodyCenter = request.body?.centerId;
    if (bodyCenter && bodyCenter !== selectedCenter) {
      throw new ForbiddenException('O centro informado não corresponde ao centro selecionado.');
    }

    const center = await this.prisma.center.findFirst({
      where: { id: selectedCenter, tenantId: user.tenantId, active: true },
      select: { id: true },
    });
    if (!center) throw new ForbiddenException('Centro inexistente ou inativo.');

    if (!user.isPrimaryAdmin) {
      const membership = await this.prisma.userCenter.findFirst({
        where: { tenantId: user.tenantId, userId: user.sub, centerId: center.id },
        select: { id: true },
      });
      if (!membership) throw new ForbiddenException('Você não tem acesso a este centro.');
    }

    request.centerId = center.id;
    TenantContextService.setSession({
      tenantId: user.tenantId,
      userId: user.sub,
      userRole: user.role,
      isPrimaryAdmin: user.isPrimaryAdmin,
      centerId: center.id,
    });
    return true;
  }
}
