// src/modules/auth/auth.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto, LoginDto } from './dto/login.dto';
import {
  AccountCategoryType,
  BankAccountType,
  TenantStatus,
  UserRole,
} from '../../common/enums/domain.enums';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registra uma nova empresa (Tenant) e o primeiro Usuário Administrador de forma atômica.
   * Cria também estruturas padrão de inicialização (Caixa Geral e Categorias básicas).
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // 1. Verifica duplicidade de documento
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { document: dto.companyDocument },
    });

    if (existingTenant) {
      throw new ConflictException('Já existe uma empresa cadastrada com este CNPJ/CPF.');
    }

    // 2. Hash da senha com salt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.adminPassword, saltRounds);

    // 3. Execução transacional ACID
    const result = await this.prisma.$transaction(async (tx) => {
      // 3.1 Criação do Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.companyName,
          tradeName: dto.companyTradeName || dto.companyName,
          document: dto.companyDocument,
          taxRegime: dto.taxRegime,
          email: dto.companyEmail,
          phone: dto.companyPhone,
          status: TenantStatus.ACTIVE,
        },
      });

      // 3.2 Criação do Usuário Administrador
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: dto.adminName,
          email: dto.adminEmail.toLowerCase().trim(),
          passwordHash,
          role: UserRole.ADMIN,
          active: true,
        },
      });

      // 3.3 Inicializa Conta Bancária padrão (Caixa Geral da Empresa)
      await tx.bankAccount.create({
        data: {
          tenantId: tenant.id,
          name: 'Caixa Geral / Principal',
          accountType: BankAccountType.CASH_REGISTER,
          initialBalance: 0,
          currentBalance: 0,
          active: true,
        },
      });

      // 3.4 Inicializa Plano de Contas básico para PME
      await tx.chartOfAccount.createMany({
        data: [
          {
            tenantId: tenant.id,
            code: '1.01',
            name: 'Receita com Vendas de Mercadorias',
            type: AccountCategoryType.REVENUE,
          },
          {
            tenantId: tenant.id,
            code: '1.02',
            name: 'Receita de Serviços Prestados',
            type: AccountCategoryType.REVENUE,
          },
          {
            tenantId: tenant.id,
            code: '2.01',
            name: 'Custos com Mercadorias e Insumos',
            type: AccountCategoryType.EXPENSE,
          },
          {
            tenantId: tenant.id,
            code: '2.02',
            name: 'Despesas Operacionais e Administrativas',
            type: AccountCategoryType.EXPENSE,
          },
        ],
      });

      return { tenant, user };
    });

    // 4. Emissão do Token JWT
    const payload = {
      sub: result.user.id,
      tenantId: result.tenant.id,
      email: result.user.email,
      role: result.user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        document: result.tenant.document,
      },
    };
  }

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
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        document: user.tenant.document,
      },
    };
  }
}
