-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_primary_admin" BOOLEAN NOT NULL DEFAULT false;

-- Apenas um administrador principal pode existir por empresa.
CREATE UNIQUE INDEX "users_one_primary_admin_per_tenant_idx"
ON "users"("tenantId") WHERE "is_primary_admin" = true;

-- AlterTable
ALTER TABLE "product_batches" ADD COLUMN     "center_id" UUID;

-- AlterTable
ALTER TABLE "sales_orders" ADD COLUMN     "center_id" UUID;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "center_id" UUID;

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "center_id" UUID;

-- AlterTable
ALTER TABLE "financial_records" ADD COLUMN     "center_id" UUID;

-- AlterTable
ALTER TABLE "bank_accounts" ADD COLUMN     "center_id" UUID;

-- AlterTable
ALTER TABLE "bank_transactions" ADD COLUMN     "center_id" UUID;

-- CreateTable
CREATE TABLE "centers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_centers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "center_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "center_id" UUID,
    "action" VARCHAR(80) NOT NULL,
    "target_type" VARCHAR(80) NOT NULL,
    "target_id" VARCHAR(100),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "center_stocks" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "center_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "center_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "centers_tenant_id_active_name_idx" ON "centers"("tenant_id", "active", "name");

-- CreateIndex
CREATE INDEX "user_centers_tenant_id_center_id_idx" ON "user_centers"("tenant_id", "center_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_centers_tenant_id_user_id_center_id_key" ON "user_centers"("tenant_id", "user_id", "center_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_target_type_target_id_idx" ON "audit_logs"("tenant_id", "target_type", "target_id");

-- CreateIndex
CREATE INDEX "center_stocks_tenant_id_center_id_idx" ON "center_stocks"("tenant_id", "center_id");

-- CreateIndex
CREATE UNIQUE INDEX "center_stocks_tenant_id_center_id_product_id_key" ON "center_stocks"("tenant_id", "center_id", "product_id");

-- CreateIndex
CREATE INDEX "sales_orders_tenantId_center_id_issueDate_idx" ON "sales_orders"("tenantId", "center_id", "issueDate");

-- CreateIndex
CREATE INDEX "purchase_orders_tenantId_center_id_issueDate_idx" ON "purchase_orders"("tenantId", "center_id", "issueDate");

-- CreateIndex
CREATE INDEX "stock_movements_tenant_id_center_id_created_at_idx" ON "stock_movements"("tenant_id", "center_id", "created_at");

-- CreateIndex
CREATE INDEX "financial_records_tenantId_center_id_dueDate_idx" ON "financial_records"("tenantId", "center_id", "dueDate");

-- CreateIndex
CREATE INDEX "bank_accounts_tenantId_center_id_active_idx" ON "bank_accounts"("tenantId", "center_id", "active");

-- CreateIndex
CREATE INDEX "bank_transactions_tenantId_center_id_transactionDate_idx" ON "bank_transactions"("tenantId", "center_id", "transactionDate");

-- AddForeignKey
ALTER TABLE "centers" ADD CONSTRAINT "centers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_centers" ADD CONSTRAINT "user_centers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_centers" ADD CONSTRAINT "user_centers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_centers" ADD CONSTRAINT "user_centers_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "center_stocks" ADD CONSTRAINT "center_stocks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "center_stocks" ADD CONSTRAINT "center_stocks_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "center_stocks" ADD CONSTRAINT "center_stocks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

