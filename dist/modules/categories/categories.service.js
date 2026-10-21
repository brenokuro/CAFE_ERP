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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/database/prisma.service");
const tenant_context_service_1 = require("../../common/multitenancy/tenant-context.service");
let CategoriesService = class CategoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const existingCode = await this.prisma.client.chartOfAccount.findFirst({
            where: { tenantId, code: dto.code },
        });
        if (existingCode) {
            throw new common_1.ConflictException(`O código de categoria "${dto.code}" já existe nesta empresa.`);
        }
        if (dto.parentId) {
            const parent = await this.prisma.client.chartOfAccount.findFirst({
                where: { id: dto.parentId, tenantId },
            });
            if (!parent) {
                throw new common_1.NotFoundException('Categoria pai informada não foi encontrada.');
            }
        }
        return this.prisma.client.chartOfAccount.create({
            data: {
                tenantId,
                code: dto.code,
                name: dto.name,
                type: dto.type,
                parentId: dto.parentId,
                active: dto.active ?? true,
            },
        });
    }
    async findAll(type) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        return this.prisma.client.chartOfAccount.findMany({
            where: {
                tenantId,
                ...(type ? { type } : {}),
            },
            include: {
                parent: { select: { id: true, code: true, name: true } },
                children: { select: { id: true, code: true, name: true } },
            },
            orderBy: { code: 'asc' },
        });
    }
    async findOne(id) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const category = await this.prisma.client.chartOfAccount.findFirst({
            where: { id, tenantId },
            include: {
                parent: true,
                children: true,
                _count: { select: { financialRecords: true } },
            },
        });
        if (!category) {
            throw new common_1.NotFoundException(`Categoria com ID ${id} não encontrada.`);
        }
        return category;
    }
    async update(id, dto) {
        await this.findOne(id);
        if (dto.parentId === id) {
            throw new common_1.BadRequestException('Uma categoria não pode ser pai dela mesma.');
        }
        return this.prisma.client.chartOfAccount.update({
            where: { id },
            data: dto,
        });
    }
    async remove(id) {
        const category = await this.findOne(id);
        if (category._count.financialRecords > 0 || category.children.length > 0) {
            return this.prisma.client.chartOfAccount.update({
                where: { id },
                data: { active: false },
            });
        }
        return this.prisma.client.chartOfAccount.delete({
            where: { id },
        });
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map