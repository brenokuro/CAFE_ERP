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
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_tenant_extension_1 = require("../multitenancy/prisma-tenant.extension");
let PrismaService = class PrismaService extends client_1.PrismaClient {
    _extendedClient;
    constructor() {
        super({
            log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        });
    }
    async onModuleInit() {
        try {
            await this.$connect();
            console.log('✅ Banco de dados PostgreSQL conectado com sucesso.');
        }
        catch (error) {
            console.warn('⚠️ PostgreSQL não conectado no momento:', error.message);
            console.warn('📌 Servidor HTTP ativo e disponível para requisições.');
        }
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
    get client() {
        if (!this._extendedClient) {
            this._extendedClient = this.$extends((0, prisma_tenant_extension_1.createMultiTenantPrismaExtension)());
        }
        return this._extendedClient;
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map