// src/common/multitenancy/prisma-tenant.extension.ts
import { Prisma } from '@prisma/client';
import { TenantContextService } from './tenant-context.service';

/**
 * Lista de modelos no Prisma Schema que contêm o campo `tenantId`
 * e exigem isolamento estrito de dados por cliente/empresa.
 */
export const TENANT_SCOPED_MODELS = [
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
] as const;

export type TenantScopedModel = typeof TENANT_SCOPED_MODELS[number];

/**
 * Prisma Extension para Multi-Tenancy Automático.
 * 
 * Intercepta todas as operações do Prisma Client:
 * 1. Em leituras (findFirst, findMany, count, aggregate): injeta `where: { tenantId }`.
 * 2. Em gravações (create): injeta `data: { tenantId }`.
 * 3. Em mutações em lote (updateMany, deleteMany): injeta `where: { tenantId }`.
 * 4. Em mutações únicas (findUnique, update, delete): converte ou valida para garantir que o registro pertence ao tenant.
 */
export const createMultiTenantPrismaExtension = () => {
  return Prisma.defineExtension((client) => {
    return client.$extends({
      name: 'multiTenantExtension',
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            // Se o model não for isolado por tenant (ex: tabela global de Tenants/Planos)
            if (!model || !TENANT_SCOPED_MODELS.includes(model as TenantScopedModel)) {
              return query(args);
            }

            // Recupera o tenantId do contexto da requisição
            const tenantId = TenantContextService.getTenantId();
            const safeArgs = (args || {}) as any;

            // 1. Operações de Criação
            if (operation === 'create') {
              safeArgs.data = {
                ...safeArgs.data,
                tenantId,
              };
            }

            // 2. Operações de Criação em Lote
            if (operation === 'createMany') {
              if (Array.isArray(safeArgs.data)) {
                safeArgs.data = safeArgs.data.map((item: any) => ({
                  ...item,
                  tenantId,
                }));
              }
            }

            // 3. Operações de Busca com filtro (findFirst, findMany, count, aggregate, groupBy)
            if (
              [
                'findFirst',
                'findFirstOrThrow',
                'findMany',
                'count',
                'aggregate',
                'groupBy',
                'updateMany',
                'deleteMany',
              ].includes(operation)
            ) {
              safeArgs.where = {
                ...(safeArgs.where || {}),
                tenantId,
              };
            }

            // 4. Operações de Identificação Única (findUnique, update, delete)
            // Em Prisma, findUnique exige a chave primária ou composite unique.
            // Para garantir que outro tenant não acerte um ID existente:
            if (['findUnique', 'findUniqueOrThrow'].includes(operation)) {
              // Converte internamente para findFirst garantindo que o tenantId coincida
              return (client as any)[model].findFirst({
                where: {
                  ...safeArgs.where,
                  tenantId,
                },
                include: safeArgs.include,
                select: safeArgs.select,
              });
            }

            if (operation === 'update' || operation === 'delete') {
              // Garante que a mutação só ocorra se o registro pertencer ao tenant
              const existing = await (client as any)[model].findFirst({
                where: {
                  ...safeArgs.where,
                  tenantId,
                },
                select: { id: true },
              });

              if (!existing) {
                throw new Error(
                  `Registro de ${model} não encontrado ou acesso não autorizado para o Tenant ativo.`,
                );
              }
            }

            return query(safeArgs);
          },
        },
      },
    });
  });
};
