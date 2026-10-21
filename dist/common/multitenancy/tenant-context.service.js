"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantContextService = void 0;
const async_hooks_1 = require("async_hooks");
class TenantContextService {
    static storage = new async_hooks_1.AsyncLocalStorage();
    static runWithContext(session, callback) {
        return this.storage.run(session, callback);
    }
    static getSession() {
        return this.storage.getStore();
    }
    static getTenantId() {
        const session = this.storage.getStore();
        if (!session || !session.tenantId) {
            throw new Error('TenantContextError: Nenhuma identificação de Tenant encontrada para esta requisição.');
        }
        return session.tenantId;
    }
    static getUserId() {
        return this.storage.getStore()?.userId;
    }
}
exports.TenantContextService = TenantContextService;
//# sourceMappingURL=tenant-context.service.js.map