-- CreateEnum
CREATE TYPE "TaxRegime" AS ENUM ('MEI', 'SIMPLES_NACIONAL', 'SIMPLES_NACIONAL_EXCESSO', 'LUCRO_PRESUMIDO', 'LUCRO_REAL');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'SALES', 'PURCHASING', 'FINANCIAL', 'STOCK', 'OPERATOR');

-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('INDIVIDUAL', 'LEGAL_ENTITY');

-- CreateEnum
CREATE TYPE "ContactRole" AS ENUM ('CUSTOMER', 'SUPPLIER', 'BOTH');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('PRODUCT', 'SERVICE');

-- CreateEnum
CREATE TYPE "SalesOrderStatus" AS ENUM ('DRAFT', 'APPROVED', 'INVOICED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'APPROVED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UnitOfMeasure" AS ENUM ('UN', 'KG', 'G', 'L', 'ML', 'M');

-- CreateEnum
CREATE TYPE "MovementDirection" AS ENUM ('IN', 'OUT', 'TRANSFER');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN_PURCHASE', 'IN_RETURN', 'IN_ADJUSTMENT', 'OUT_SALE', 'OUT_RETURN', 'OUT_LOSS', 'OUT_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "StockReferenceType" AS ENUM ('SALES_ORDER', 'PURCHASE_ORDER', 'INVENTORY_ADJUSTMENT', 'MANUAL');

-- CreateEnum
CREATE TYPE "AccountCategoryType" AS ENUM ('REVENUE', 'EXPENSE', 'ASSET', 'LIABILITY');

-- CreateEnum
CREATE TYPE "FinancialRecordType" AS ENUM ('RECEIVABLE', 'PAYABLE');

-- CreateEnum
CREATE TYPE "FinancialRecordStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('CHECKING', 'SAVINGS', 'INVESTMENT', 'CASH_REGISTER');

-- CreateEnum
CREATE TYPE "BankTransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "tradeName" VARCHAR(255),
    "document" VARCHAR(20) NOT NULL,
    "stateRegistration" VARCHAR(30),
    "municipalRegistration" VARCHAR(30),
    "taxRegime" "TaxRegime" NOT NULL DEFAULT 'SIMPLES_NACIONAL',
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20),
    "street" VARCHAR(255),
    "number" VARCHAR(30),
    "complement" VARCHAR(100),
    "neighborhood" VARCHAR(100),
    "city" VARCHAR(100),
    "state" VARCHAR(2),
    "zipCode" VARCHAR(10),
    "ibgeCode" VARCHAR(10),
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "personType" "PersonType" NOT NULL DEFAULT 'LEGAL_ENTITY',
    "role" "ContactRole" NOT NULL DEFAULT 'CUSTOMER',
    "name" VARCHAR(255) NOT NULL,
    "tradeName" VARCHAR(255),
    "document" VARCHAR(20),
    "stateRegistration" VARCHAR(30),
    "municipalRegistration" VARCHAR(30),
    "email" VARCHAR(150),
    "phone" VARCHAR(20),
    "mobile" VARCHAR(20),
    "street" VARCHAR(255),
    "number" VARCHAR(30),
    "complement" VARCHAR(100),
    "neighborhood" VARCHAR(100),
    "city" VARCHAR(100),
    "state" VARCHAR(2),
    "zipCode" VARCHAR(10),
    "creditLimit" DECIMAL(15,2),
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "type" "ProductType" NOT NULL DEFAULT 'PRODUCT',
    "sku" VARCHAR(60) NOT NULL,
    "barcode" VARCHAR(60),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "unit_of_measure" "UnitOfMeasure" NOT NULL DEFAULT 'UN',
    "unit" VARCHAR(10) DEFAULT 'UN',
    "is_batch_controlled" BOOLEAN NOT NULL DEFAULT false,
    "sale_price" DECIMAL(12,4) NOT NULL,
    "cost_price" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "stock_quantity" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "min_stock" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "ncm" VARCHAR(10),
    "nbs" VARCHAR(10),
    "cest" VARCHAR(10),
    "cfopDefault" VARCHAR(10),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_batches" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "batch_code" VARCHAR(60) NOT NULL,
    "expiration_date" DATE,
    "quantity" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movement_types" (
    "code" VARCHAR(10) NOT NULL,
    "description" VARCHAR(150) NOT NULL,
    "direction" "MovementDirection" NOT NULL,
    "requires_reason" BOOLEAN NOT NULL DEFAULT false,
    "requires_batch" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "movement_types_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "sales_orders" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "orderNumber" INTEGER NOT NULL,
    "customerId" UUID NOT NULL,
    "status" "SalesOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryDate" TIMESTAMPTZ(6),
    "paymentTerm" VARCHAR(100),
    "totalGross" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalDiscount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalFreight" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalTaxes" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalNet" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order_items" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "salesOrderId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unitPrice" DECIMAL(12,4) NOT NULL,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalPrice" DECIMAL(15,2) NOT NULL,
    "notes" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sales_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "orderNumber" INTEGER NOT NULL,
    "supplierId" UUID NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "invoiceKey" VARCHAR(44),
    "invoiceSeries" VARCHAR(10),
    "invoiceNumber" VARCHAR(20),
    "xmlUrl" VARCHAR(500),
    "issueDate" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "arrivalDate" TIMESTAMPTZ(6),
    "totalGross" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalDiscount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalFreight" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalOtherExpenses" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalNet" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "purchaseOrderId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unitCost" DECIMAL(12,4) NOT NULL,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "otherExpenses" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(15,2) NOT NULL,
    "notes" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "batch_id" UUID,
    "movement_type_code" VARCHAR(10) NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "previous_stock" DECIMAL(12,4) NOT NULL,
    "new_stock" DECIMAL(12,4) NOT NULL,
    "unit_cost" DECIMAL(12,4),
    "total_cost" DECIMAL(15,2),
    "document_number" VARCHAR(100),
    "user_id" UUID,
    "reason" TEXT,
    "reference_type" "StockReferenceType",
    "reference_id" VARCHAR(100),
    "sales_order_id" UUID,
    "purchase_order_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chart_of_accounts" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "type" "AccountCategoryType" NOT NULL,
    "parentId" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "chart_of_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_records" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "type" "FinancialRecordType" NOT NULL,
    "status" "FinancialRecordStatus" NOT NULL DEFAULT 'PENDING',
    "description" VARCHAR(255) NOT NULL,
    "contactId" UUID,
    "chartOfAccountId" UUID,
    "dueDate" DATE NOT NULL,
    "issueDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "competencyDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentDate" DATE,
    "originalAmount" DECIMAL(15,2) NOT NULL,
    "discountAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "fineAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "interestAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balanceAmount" DECIMAL(15,2) NOT NULL,
    "installmentNumber" INTEGER NOT NULL DEFAULT 1,
    "totalInstallments" INTEGER NOT NULL DEFAULT 1,
    "salesOrderId" UUID,
    "purchaseOrderId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "financial_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "bankCode" VARCHAR(10),
    "bankName" VARCHAR(100),
    "agency" VARCHAR(20),
    "accountNumber" VARCHAR(30),
    "accountType" "BankAccountType" NOT NULL DEFAULT 'CHECKING',
    "initialBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transactions" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "bankAccountId" UUID NOT NULL,
    "financialRecordId" UUID,
    "type" "BankTransactionType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "transactionDate" DATE NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciledAt" TIMESTAMPTZ(6),
    "externalReferenceId" VARCHAR(100),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_document_key" ON "tenants"("document");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_email_key" ON "users"("tenantId", "email");

-- CreateIndex
CREATE INDEX "contacts_tenantId_role_idx" ON "contacts"("tenantId", "role");

-- CreateIndex
CREATE INDEX "contacts_tenantId_document_idx" ON "contacts"("tenantId", "document");

-- CreateIndex
CREATE INDEX "contacts_tenantId_name_idx" ON "contacts"("tenantId", "name");

-- CreateIndex
CREATE INDEX "products_tenant_id_barcode_idx" ON "products"("tenant_id", "barcode");

-- CreateIndex
CREATE INDEX "products_tenant_id_name_idx" ON "products"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "products_tenant_id_sku_key" ON "products"("tenant_id", "sku");

-- CreateIndex
CREATE INDEX "product_batches_tenant_id_product_id_idx" ON "product_batches"("tenant_id", "product_id");

-- CreateIndex
CREATE INDEX "product_batches_tenant_id_expiration_date_idx" ON "product_batches"("tenant_id", "expiration_date");

-- CreateIndex
CREATE UNIQUE INDEX "product_batches_tenant_id_product_id_batch_code_key" ON "product_batches"("tenant_id", "product_id", "batch_code");

-- CreateIndex
CREATE INDEX "sales_orders_tenantId_status_idx" ON "sales_orders"("tenantId", "status");

-- CreateIndex
CREATE INDEX "sales_orders_tenantId_customerId_idx" ON "sales_orders"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "sales_orders_tenantId_issueDate_idx" ON "sales_orders"("tenantId", "issueDate");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_tenantId_orderNumber_key" ON "sales_orders"("tenantId", "orderNumber");

-- CreateIndex
CREATE INDEX "sales_order_items_tenantId_salesOrderId_idx" ON "sales_order_items"("tenantId", "salesOrderId");

-- CreateIndex
CREATE INDEX "sales_order_items_tenantId_productId_idx" ON "sales_order_items"("tenantId", "productId");

-- CreateIndex
CREATE INDEX "purchase_orders_tenantId_status_idx" ON "purchase_orders"("tenantId", "status");

-- CreateIndex
CREATE INDEX "purchase_orders_tenantId_supplierId_idx" ON "purchase_orders"("tenantId", "supplierId");

-- CreateIndex
CREATE INDEX "purchase_orders_tenantId_invoiceKey_idx" ON "purchase_orders"("tenantId", "invoiceKey");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_tenantId_orderNumber_key" ON "purchase_orders"("tenantId", "orderNumber");

-- CreateIndex
CREATE INDEX "purchase_order_items_tenantId_purchaseOrderId_idx" ON "purchase_order_items"("tenantId", "purchaseOrderId");

-- CreateIndex
CREATE INDEX "purchase_order_items_tenantId_productId_idx" ON "purchase_order_items"("tenantId", "productId");

-- CreateIndex
CREATE INDEX "stock_movements_tenant_id_product_id_created_at_idx" ON "stock_movements"("tenant_id", "product_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_movements_tenant_id_movement_type_code_idx" ON "stock_movements"("tenant_id", "movement_type_code");

-- CreateIndex
CREATE INDEX "stock_movements_tenant_id_batch_id_idx" ON "stock_movements"("tenant_id", "batch_id");

-- CreateIndex
CREATE INDEX "stock_movements_tenant_id_document_number_idx" ON "stock_movements"("tenant_id", "document_number");

-- CreateIndex
CREATE INDEX "stock_movements_tenant_id_sales_order_id_idx" ON "stock_movements"("tenant_id", "sales_order_id");

-- CreateIndex
CREATE INDEX "stock_movements_tenant_id_purchase_order_id_idx" ON "stock_movements"("tenant_id", "purchase_order_id");

-- CreateIndex
CREATE INDEX "chart_of_accounts_tenantId_type_idx" ON "chart_of_accounts"("tenantId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "chart_of_accounts_tenantId_code_key" ON "chart_of_accounts"("tenantId", "code");

-- CreateIndex
CREATE INDEX "financial_records_tenantId_type_status_idx" ON "financial_records"("tenantId", "type", "status");

-- CreateIndex
CREATE INDEX "financial_records_tenantId_dueDate_idx" ON "financial_records"("tenantId", "dueDate");

-- CreateIndex
CREATE INDEX "financial_records_tenantId_contactId_idx" ON "financial_records"("tenantId", "contactId");

-- CreateIndex
CREATE INDEX "financial_records_tenantId_salesOrderId_idx" ON "financial_records"("tenantId", "salesOrderId");

-- CreateIndex
CREATE INDEX "financial_records_tenantId_purchaseOrderId_idx" ON "financial_records"("tenantId", "purchaseOrderId");

-- CreateIndex
CREATE INDEX "bank_accounts_tenantId_active_idx" ON "bank_accounts"("tenantId", "active");

-- CreateIndex
CREATE INDEX "bank_transactions_tenantId_bankAccountId_transactionDate_idx" ON "bank_transactions"("tenantId", "bankAccountId", "transactionDate");

-- CreateIndex
CREATE INDEX "bank_transactions_tenantId_reconciled_idx" ON "bank_transactions"("tenantId", "reconciled");

-- CreateIndex
CREATE INDEX "bank_transactions_tenantId_financialRecordId_idx" ON "bank_transactions"("tenantId", "financialRecordId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "product_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_movement_type_code_fkey" FOREIGN KEY ("movement_type_code") REFERENCES "movement_types"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_chartOfAccountId_fkey" FOREIGN KEY ("chartOfAccountId") REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_financialRecordId_fkey" FOREIGN KEY ("financialRecordId") REFERENCES "financial_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

