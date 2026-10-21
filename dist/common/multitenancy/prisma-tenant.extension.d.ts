export declare const TENANT_SCOPED_MODELS: readonly ["User", "Contact", "Product", "ProductBatch", "SalesOrder", "SalesOrderItem", "PurchaseOrder", "PurchaseOrderItem", "StockMovement", "ChartOfAccount", "FinancialRecord", "BankAccount", "BankTransaction"];
export type TenantScopedModel = typeof TENANT_SCOPED_MODELS[number];
export declare const createMultiTenantPrismaExtension: () => (client: any) => {
    $extends: {
        extArgs: {
            result: {};
            model: {};
            query: {};
            client: {};
        };
    };
};
