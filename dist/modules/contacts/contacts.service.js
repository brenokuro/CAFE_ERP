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
exports.ContactsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/database/prisma.service");
const tenant_context_service_1 = require("../../common/multitenancy/tenant-context.service");
const domain_enums_1 = require("../../common/enums/domain.enums");
const client_1 = require("@prisma/client");
let ContactsService = class ContactsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        return this.prisma.client.contact.create({
            data: {
                tenantId,
                personType: dto.personType,
                role: dto.role,
                name: dto.name,
                tradeName: dto.tradeName,
                document: dto.document,
                stateRegistration: dto.stateRegistration,
                municipalRegistration: dto.municipalRegistration,
                email: dto.email,
                phone: dto.phone,
                mobile: dto.mobile,
                street: dto.street,
                number: dto.number,
                complement: dto.complement,
                neighborhood: dto.neighborhood,
                city: dto.city,
                state: dto.state,
                zipCode: dto.zipCode,
                creditLimit: dto.creditLimit !== undefined ? new client_1.Prisma.Decimal(dto.creditLimit) : null,
                notes: dto.notes,
                active: dto.active ?? true,
            },
        });
    }
    async findAll(role, search) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const where = {
            tenantId,
            ...(role ? { role: { in: [role, domain_enums_1.ContactRole.BOTH] } } : {}),
            ...(search
                ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { tradeName: { contains: search, mode: 'insensitive' } },
                        { document: { contains: search } },
                        { email: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        return this.prisma.client.contact.findMany({
            where,
            orderBy: { name: 'asc' },
        });
    }
    async findOne(id) {
        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
        const contact = await this.prisma.client.contact.findFirst({
            where: { id, tenantId },
            include: {
                _count: {
                    select: {
                        salesOrders: true,
                        purchaseOrders: true,
                        financialRecords: true,
                    },
                },
            },
        });
        if (!contact) {
            throw new common_1.NotFoundException(`Contato com ID ${id} não encontrado.`);
        }
        return contact;
    }
    async update(id, dto) {
        await this.findOne(id);
        const data = {
            ...dto,
            creditLimit: dto.creditLimit !== undefined ? new client_1.Prisma.Decimal(dto.creditLimit) : undefined,
        };
        return this.prisma.client.contact.update({
            where: { id },
            data,
        });
    }
    async remove(id) {
        const contact = await this.findOne(id);
        const hasRelations = contact._count.salesOrders > 0 ||
            contact._count.purchaseOrders > 0 ||
            contact._count.financialRecords > 0;
        if (hasRelations) {
            return this.prisma.client.contact.update({
                where: { id },
                data: { active: false },
            });
        }
        return this.prisma.client.contact.delete({
            where: { id },
        });
    }
};
exports.ContactsService = ContactsService;
exports.ContactsService = ContactsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContactsService);
//# sourceMappingURL=contacts.service.js.map