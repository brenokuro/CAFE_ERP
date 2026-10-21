// src/common/enums/domain.enums.ts

export enum TaxRegime {
  MEI = 'MEI',
  SIMPLES_NACIONAL = 'SIMPLES_NACIONAL',
  SIMPLES_NACIONAL_EXCESSO = 'SIMPLES_NACIONAL_EXCESSO',
  LUCRO_PRESUMIDO = 'LUCRO_PRESUMIDO',
  LUCRO_REAL = 'LUCRO_REAL',
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  SALES = 'SALES',
  PURCHASING = 'PURCHASING',
  FINANCIAL = 'FINANCIAL',
  STOCK = 'STOCK',
  OPERATOR = 'OPERATOR',
}

export enum PersonType {
  INDIVIDUAL = 'INDIVIDUAL',     // Pessoa Física (CPF)
  LEGAL_ENTITY = 'LEGAL_ENTITY', // Pessoa Jurídica (CNPJ)
}

export enum ContactRole {
  CUSTOMER = 'CUSTOMER',         // Cliente
  SUPPLIER = 'SUPPLIER',         // Fornecedor
  BOTH = 'BOTH',                 // Cliente & Fornecedor
}

export enum ProductType {
  PRODUCT = 'PRODUCT',           // Mercadoria / Produto Físico
  SERVICE = 'SERVICE',           // Prestação de Serviço
}

export enum SalesOrderStatus {
  DRAFT = 'DRAFT',               // Orçamento / Aberto
  APPROVED = 'APPROVED',         // Aprovado
  INVOICED = 'INVOICED',         // Faturado (Gera Financeiro e baixa Estoque)
  CANCELLED = 'CANCELLED',       // Cancelado
}

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',               // Cotação
  APPROVED = 'APPROVED',         // Pedido de compra fechado
  RECEIVED = 'RECEIVED',         // Mercadoria recebida (Gera Contas a Pagar e entrada Estoque)
  CANCELLED = 'CANCELLED',       // Cancelado
}

export enum UnitOfMeasure {
  UN = 'UN', // Unidade
  KG = 'KG', // Quilograma
  G = 'G',   // Grama
  L = 'L',   // Litro
  ML = 'ML', // Mililitro
  M = 'M',   // Metro
}

export enum MovementDirection {
  IN = 'IN',             // Entrada no estoque (+ saldo)
  OUT = 'OUT',           // Saída do estoque (- saldo)
  TRANSFER = 'TRANSFER', // Transferência entre centros/almoxarifados
}

/**
 * Códigos padronizados de Movimentação de Estoque (Padrão SAP / Auditáveis)
 */
export enum MovementTypeCode {
  IN_PURCHASE = '101',         // Entrada por Compra/Fornecedor
  OUT_PRODUCTION = '201',      // Consumo por Produção/Uso Interno
  IN_PRODUCTION_REV = '202',   // Estorno de Consumo por Produção
  TRANSFER = '301',            // Transferência entre Centros/Almoxarifados
  OUT_LOSS = '501',            // Baixa por Perda / Avaria / Validade
  IN_LOSS_REV = '502',         // Estorno de Baixa por Perda
  OUT_SALE = '601',            // Saída por Venda/Faturamento
  IN_SALE_RETURN = '602',      // Devolução de Venda por Cliente
}

export enum StockMovementType {
  IN_PURCHASE = 'IN_PURCHASE',       // Entrada por compra
  IN_RETURN = 'IN_RETURN',           // Entrada por devolução
  IN_ADJUSTMENT = 'IN_ADJUSTMENT',   // Ajuste de inventário positivo
  OUT_SALE = 'OUT_SALE',             // Saída por faturamento
  OUT_RETURN = 'OUT_RETURN',         // Devolução a fornecedor
  OUT_LOSS = 'OUT_LOSS',             // Perda / Avaria
  OUT_ADJUSTMENT = 'OUT_ADJUSTMENT', // Ajuste de inventário negativo
}

export enum StockReferenceType {
  SALES_ORDER = 'SALES_ORDER',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  INVENTORY_ADJUSTMENT = 'INVENTORY_ADJUSTMENT',
  MANUAL = 'MANUAL',
}

export enum AccountCategoryType {
  REVENUE = 'REVENUE',   // Receitas
  EXPENSE = 'EXPENSE',   // Despesas
  ASSET = 'ASSET',       // Ativos
  LIABILITY = 'LIABILITY', // Passivos
}

export enum FinancialRecordType {
  RECEIVABLE = 'RECEIVABLE', // Contas a Receber
  PAYABLE = 'PAYABLE',       // Contas a Pagar
}

export enum FinancialRecordStatus {
  PENDING = 'PENDING',               // Em aberto
  PARTIALLY_PAID = 'PARTIALLY_PAID', // Baixa parcial
  PAID = 'PAID',                     // Liquidado
  OVERDUE = 'OVERDUE',               // Vencido
  CANCELLED = 'CANCELLED',           // Cancelado
}

export enum BankAccountType {
  CHECKING = 'CHECKING',           // Conta Corrente
  SAVINGS = 'SAVINGS',             // Poupança
  INVESTMENT = 'INVESTMENT',       // Aplicação
  CASH_REGISTER = 'CASH_REGISTER', // Caixa Físico (Dinheiro)
}

export enum BankTransactionType {
  CREDIT = 'CREDIT', // Entrada
  DEBIT = 'DEBIT',   // Saída
}
