// src/modules/auth/auth.service.ts
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/database/prisma.service';
import { AuthResponseDto, LoginDto } from './dto/login.dto';
import { TenantStatus } from '../../common/enums/domain.enums';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Autentica o usuário validando credenciais, tenant ativo e senha criptografada.
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const email = dto.email.toLowerCase().trim();

    // Busca usuários com o e-mail informado
    const users = await this.prisma.user.findMany({
      where: {
        email,
        ...(dto.tenantId ? { tenantId: dto.tenantId } : {}),
      },
      include: {
        tenant: true,
      },
    });

    if (!users || users.length === 0) {
      throw new UnauthorizedException('Credenciais inválidas: e-mail ou senha incorretos.');
    }

    if (users.length > 1 && !dto.tenantId) {
      throw new BadRequestException(
        'Este e-mail pertence a múltiplas empresas. Informe o "tenantId" para prosseguir.',
      );
    }

    const user = users[0];

    // Validação da senha
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas: e-mail ou senha incorretos.');
    }

    if (!user.active) {
      throw new UnauthorizedException('Este usuário está inativo.');
    }

    if (user.tenant.status !== TenantStatus.ACTIVE) {
      throw new UnauthorizedException(
        `Acesso bloqueado: a empresa encontra-se com status "${user.tenant.status}".`,
      );
    }

    // Geração do token
    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      isPrimaryAdmin: user.isPrimaryAdmin,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isPrimaryAdmin: user.isPrimaryAdmin,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        document: user.tenant.document,
      },
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, active: true },
      include: {
        tenant: true,
        userCenters: { where: { center: { active: true } }, include: { center: true } },
      },
    });
    if (!user) throw new UnauthorizedException('Usuário inativo ou não encontrado.');
    const centers = user.isPrimaryAdmin
      ? await this.prisma.center.findMany({ where: { tenantId: user.tenantId, active: true }, orderBy: { name: 'asc' } })
      : user.userCenters.map((membership) => membership.center);
    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role, isPrimaryAdmin: user.isPrimaryAdmin },
      tenant: { id: user.tenant.id, name: user.tenant.name, document: user.tenant.document },
      centers: centers.map(({ id, name, active }) => ({ id, name, active })),
    };
  }
}
