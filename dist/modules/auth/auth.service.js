"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../../common/database/prisma.service");
const domain_enums_1 = require("../../common/enums/domain.enums");
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(dto) {
        const existingTenant = await this.prisma.tenant.findUnique({
            where: { document: dto.companyDocument },
        });
        if (existingTenant) {
            throw new common_1.ConflictException('Já existe uma empresa cadastrada com este CNPJ/CPF.');
        }
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(dto.adminPassword, saltRounds);
        const result = await this.prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: dto.companyName,
                    tradeName: dto.companyTradeName || dto.companyName,
                    document: dto.companyDocument,
                    taxRegime: dto.taxRegime,
                    email: dto.companyEmail,
                    phone: dto.companyPhone,
                    status: domain_enums_1.TenantStatus.ACTIVE,
                },
            });
            const user = await tx.user.create({
                data: {
                    tenantId: tenant.id,
                    name: dto.adminName,
                    email: dto.adminEmail.toLowerCase().trim(),
                    passwordHash,
                    role: domain_enums_1.UserRole.ADMIN,
                    active: true,
                },
            });
            await tx.bankAccount.create({
                data: {
                    tenantId: tenant.id,
                    name: 'Caixa Geral / Principal',
                    accountType: domain_enums_1.BankAccountType.CASH_REGISTER,
                    initialBalance: 0,
                    currentBalance: 0,
                    active: true,
                },
            });
            await tx.chartOfAccount.createMany({
                data: [
                    {
                        tenantId: tenant.id,
                        code: '1.01',
                        name: 'Receita com Vendas de Mercadorias',
                        type: domain_enums_1.AccountCategoryType.REVENUE,
                    },
                    {
                        tenantId: tenant.id,
                        code: '1.02',
                        name: 'Receita de Serviços Prestados',
                        type: domain_enums_1.AccountCategoryType.REVENUE,
                    },
                    {
                        tenantId: tenant.id,
                        code: '2.01',
                        name: 'Custos com Mercadorias e Insumos',
                        type: domain_enums_1.AccountCategoryType.EXPENSE,
                    },
                    {
                        tenantId: tenant.id,
                        code: '2.02',
                        name: 'Despesas Operacionais e Administrativas',
                        type: domain_enums_1.AccountCategoryType.EXPENSE,
                    },
                ],
            });
            return { tenant, user };
        });
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
    async login(dto) {
        const email = dto.email.toLowerCase().trim();
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
            throw new common_1.UnauthorizedException('Credenciais inválidas: e-mail ou senha incorretos.');
        }
        if (users.length > 1 && !dto.tenantId) {
            throw new common_1.BadRequestException('Este e-mail pertence a múltiplas empresas. Informe o "tenantId" para prosseguir.');
        }
        const user = users[0];
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Credenciais inválidas: e-mail ou senha incorretos.');
        }
        if (!user.active) {
            throw new common_1.UnauthorizedException('Este usuário está inativo.');
        }
        if (user.tenant.status !== domain_enums_1.TenantStatus.ACTIVE) {
            throw new common_1.UnauthorizedException(`Acesso bloqueado: a empresa encontra-se com status "${user.tenant.status}".`);
        }
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map