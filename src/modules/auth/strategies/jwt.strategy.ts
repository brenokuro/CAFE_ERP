// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../common/database/prisma.service';
import { TenantStatus } from '../../../common/enums/domain.enums';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.tenantId) {
      throw new UnauthorizedException('Payload do JWT inválido para acesso ao ERP.');
    }
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, tenantId: payload.tenantId, active: true },
      include: { tenant: true },
    });
    if (!user || user.tenant.status !== TenantStatus.ACTIVE) {
      throw new UnauthorizedException('Usuário inativo ou empresa sem acesso.');
    }
    return {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      isPrimaryAdmin: user.isPrimaryAdmin,
    };
  }
}
