-- ============================================================================
-- CAFE ERP - Database Migration: Motor de Movimentações e Insumos Fracionados
-- Migração: 20261021_movement_engine_and_fractional_stock
-- Suporte a alta precisão NUMERIC(12, 4), rastreabilidade por lote e tipos de movimento SAP
-- ============================================================================

-- 1. Criação dos novos tipos enumerados do domínio
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unit_of_measure') THEN
        CREATE TYPE "unit_of_measure" AS ENUM ('UN', 'KG', 'G', 'L', 'ML', 'M');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movement_direction') THEN
        CREATE TYPE "movement_direction" AS ENUM ('IN', 'OUT', 'TRANSFER');
    END IF;
END $$;

-- 2. Tabela de Domínio: Tipos de Movimento Padronizados (SAP / Auditáveis)
CREATE TABLE IF NOT EXISTS "movement_types" (
    "code" VARCHAR(10) PRIMARY KEY,
    "description" VARCHAR(150) NOT NULL,
    "direction" "movement_direction" NOT NULL,
    "requires_reason" BOOLEAN NOT NULL DEFAULT false,
    "requires_batch" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

-- Carga inicial dos Tipos de Movimento Oficiais do CAFE ERP
INSERT INTO "movement_types" ("code", "description", "direction", "requires_reason", "requires_batch", "active", "updated_at")
VALUES
    ('101', 'Entrada por Compra/Fornecedor', 'IN', false, false, true, now()),
    ('201', 'Consumo por Produção/Uso Interno', 'OUT', false, false, true, now()),
    ('202', 'Estorno de Consumo por Produção', 'IN', true, false, true, now()),
    ('301', 'Transferência entre Centros/Almoxarifados', 'TRANSFER', false, false, true, now()),
    ('501', 'Baixa por Perda / Avaria / Validade', 'OUT', true, false, true, now()),
    ('502', 'Estorno de Baixa por Perda', 'IN', true, false, true, now()),
    ('601', 'Saída por Venda/Faturamento', 'OUT', false, false, true, now()),
    ('602', 'Devolução de Venda por Cliente', 'IN', false, false, true, now())
ON CONFLICT ("code") DO UPDATE SET
    "description" = EXCLUDED."description",
    "direction" = EXCLUDED."direction",
    "requires_reason" = EXCLUDED."requires_reason",
    "updated_at" = now();

-- 3. Atualização da Tabela de Produtos (Insumos Fracionados e Rastreabilidade)
ALTER TABLE "products"
    ADD COLUMN IF NOT EXISTS "unit_of_measure" "unit_of_measure" NOT NULL DEFAULT 'UN',
    ADD COLUMN IF NOT EXISTS "is_batch_controlled" BOOLEAN NOT NULL DEFAULT false,
    ALTER COLUMN "sale_price" TYPE NUMERIC(12, 4),
    ALTER COLUMN "cost_price" TYPE NUMERIC(12, 4),
    ALTER COLUMN "stock_quantity" TYPE NUMERIC(12, 4),
    ALTER COLUMN "min_stock" TYPE NUMERIC(12, 4);

-- 4. Nova Tabela: ProductBatches (Lotes, Validade e Saldo por Lote)
CREATE TABLE IF NOT EXISTS "product_batches" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "batch_code" VARCHAR(60) NOT NULL,
    "expiration_date" DATE,
    "quantity" NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    CONSTRAINT "uq_product_batches_tenant_product_code" UNIQUE ("tenant_id", "product_id", "batch_code")
);

CREATE INDEX IF NOT EXISTS "idx_product_batches_tenant_product" ON "product_batches"("tenant_id", "product_id");
CREATE INDEX IF NOT EXISTS "idx_product_batches_tenant_expiration" ON "product_batches"("tenant_id", "expiration_date");

-- 5. Atualização da Tabela de Itens de Pedidos de Venda e Compra para NUMERIC(12, 4)
ALTER TABLE "sales_order_items"
    ALTER COLUMN "quantity" TYPE NUMERIC(12, 4),
    ALTER COLUMN "unitPrice" TYPE NUMERIC(12, 4);

ALTER TABLE "purchase_order_items"
    ALTER COLUMN "quantity" TYPE NUMERIC(12, 4),
    ALTER COLUMN "unitCost" TYPE NUMERIC(12, 4);

-- 6. Atualização da Tabela de Histórico de Movimentações de Estoque (StockMovements)
ALTER TABLE "stock_movements"
    ADD COLUMN IF NOT EXISTS "batch_id" UUID REFERENCES "product_batches"("id") ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS "movement_type_code" VARCHAR(10) REFERENCES "movement_types"("code") ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS "document_number" VARCHAR(100),
    ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    ALTER COLUMN "quantity" TYPE NUMERIC(12, 4),
    ALTER COLUMN "previous_stock" TYPE NUMERIC(12, 4),
    ALTER COLUMN "new_stock" TYPE NUMERIC(12, 4),
    ALTER COLUMN "unit_cost" TYPE NUMERIC(12, 4);

-- Criação de índices para consultas auditáveis e relatórios fiscais/inventário
CREATE INDEX IF NOT EXISTS "idx_stock_movements_tenant_product_date" ON "stock_movements"("tenant_id", "product_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_stock_movements_tenant_type" ON "stock_movements"("tenant_id", "movement_type_code");
CREATE INDEX IF NOT EXISTS "idx_stock_movements_tenant_batch" ON "stock_movements"("tenant_id", "batch_id");
CREATE INDEX IF NOT EXISTS "idx_stock_movements_tenant_doc" ON "stock_movements"("tenant_id", "document_number");
