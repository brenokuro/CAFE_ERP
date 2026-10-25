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
    async getCurrentUser(userId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, active: true },
            include: {
                tenant: true,
                userCenters: { where: { center: { active: true } }, include: { center: true } },
            },
        });
        if (!user)
            throw new common_1.UnauthorizedException('Usuário inativo ou não encontrado.');
        const centers = user.isPrimaryAdmin
            ? await this.prisma.center.findMany({ where: { tenantId: user.tenantId, active: true }, orderBy: { name: 'asc' } })
            : user.userCenters.map((membership) => membership.center);
        return {
            user: { id: user.id, name: user.name, email: user.email, role: user.role, isPrimaryAdmin: user.isPrimaryAdmin },
            tenant: { id: user.tenant.id, name: user.tenant.name, document: user.tenant.document },
            centers: centers.map(({ id, name, active }) => ({ id, name, active })),
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