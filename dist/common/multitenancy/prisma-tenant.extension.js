"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMultiTenantPrismaExtension = exports.TENANT_SCOPED_MODELS = void 0;
const client_1 = require("@prisma/client");
const tenant_context_service_1 = require("./tenant-context.service");
exports.TENANT_SCOPED_MODELS = [
    'User',
    'Contact',
    'Product',
    'ProductBatch',
    'SalesOrder',
    'SalesOrderItem',
    'PurchaseOrder',
    'PurchaseOrderItem',
    'StockMovement',
    'ChartOfAccount',
    'FinancialRecord',
    'BankAccount',
    'BankTransaction',
];
const createMultiTenantPrismaExtension = () => {
    return client_1.Prisma.defineExtension((client) => {
        return client.$extends({
            name: 'multiTenantExtension',
            query: {
                $allModels: {
                    async $allOperations({ model, operation, args, query }) {
                        if (!model || !exports.TENANT_SCOPED_MODELS.includes(model)) {
                            return query(args);
                        }
                        const tenantId = tenant_context_service_1.TenantContextService.getTenantId();
                        const safeArgs = (args || {});
                        if (operation === 'create') {
                            safeArgs.data = {
                                ...safeArgs.data,
                                tenantId,
                            };
                        }
                        if (operation === 'createMany') {
                            if (Array.isArray(safeArgs.data)) {
                                safeArgs.data = safeArgs.data.map((item) => ({
                                    ...item,
                                    tenantId,
                                }));
                            }
                        }
                        if ([
                            'findFirst',
                            'findFirstOrThrow',
                            'findMany',
                            'count',
                            'aggregate',
                            'groupBy',
                            'updateMany',
                            'deleteMany',
                        ].includes(operation)) {
                            safeArgs.where = {
                                ...(safeArgs.where || {}),
                                tenantId,
                            };
                        }
                        if (['findUnique', 'findUniqueOrThrow'].includes(operation)) {
                            return client[model].findFirst({
                                where: {
                                    ...safeArgs.where,
                                    tenantId,
                                },
                                include: safeArgs.include,
                                select: safeArgs.select,
                            });
                        }
                        if (operation === 'update' || operation === 'delete') {
                            const existing = await client[model].findFirst({
                                where: {
                                    ...safeArgs.where,
                                    tenantId,
                                },
                                select: { id: true },
                            });
                            if (!existing) {
                                throw new Error(`Registro de ${model} não encontrado ou acesso não autorizado para o Tenant ativo.`);
                            }
                        }
                        return query(safeArgs);
                    },
                },
            },
        });
    });
};
exports.createMultiTenantPrismaExtension = createMultiTenantPrismaExtension;
//# sourceMappingURL=prisma-tenant.extension.js.map