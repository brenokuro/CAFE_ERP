"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const tenant_context_service_1 = require("../multitenancy/tenant-context.service");
let JwtAuthGuard = class JwtAuthGuard extends (0, passport_1.AuthGuard)('jwt') {
    async canActivate(context) {
        const parentCanActivate = (await super.canActivate(context));
        if (!parentCanActivate) {
            return false;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.tenantId) {
            throw new common_1.UnauthorizedException('Token inválido: Tenant ID ausente nos claims.');
        }
        request.tenantId = user.tenantId;
        tenant_context_service_1.TenantContextService.setSession({
            tenantId: user.tenantId,
            userId: user.sub || user.userId,
            userRole: user.role,
            isPrimaryAdmin: user.isPrimaryAdmin,
        });
        return true;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)()
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map