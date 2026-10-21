export declare enum TaxRegime {
    MEI = "MEI",
    SIMPLES_NACIONAL = "SIMPLES_NACIONAL",
    SIMPLES_NACIONAL_EXCESSO = "SIMPLES_NACIONAL_EXCESSO",
    LUCRO_PRESUMIDO = "LUCRO_PRESUMIDO",
    LUCRO_REAL = "LUCRO_REAL"
}
export declare enum TenantStatus {
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
    CANCELLED = "CANCELLED"
}
export declare enum UserRole {
    ADMIN = "ADMIN",
    MANAGER = "MANAGER",
    SALES = "SALES",
    PURCHASING = "PURCHASING",
    FINANCIAL = "FINANCIAL",
    STOCK = "STOCK",
    OPERATOR = "OPERATOR"
}
export declare enum PersonType {
    INDIVIDUAL = "INDIVIDUAL",
    LEGAL_ENTITY = "LEGAL_ENTITY"
}
export declare enum ContactRole {
    CUSTOMER = "CUSTOMER",
    SUPPLIER = "SUPPLIER",
    BOTH = "BOTH"
}
export declare enum ProductType {
    PRODUCT = "PRODUCT",
    SERVICE = "SERVICE"
}
export declare enum SalesOrderStatus {
    DRAFT = "DRAFT",
    APPROVED = "APPROVED",
    INVOICED = "INVOICED",
    CANCELLED = "CANCELLED"
}
export declare enum PurchaseOrderStatus {
    DRAFT = "DRAFT",
    APPROVED = "APPROVED",
    RECEIVED = "RECEIVED",
    CANCELLED = "CANCELLED"
}
export declare enum UnitOfMeasure {
    UN = "UN",
    KG = "KG",
    G = "G",
    L = "L",
    ML = "ML",
    M = "M"
}
export declare enum MovementDirection {
    IN = "IN",
    OUT = "OUT",
    TRANSFER = "TRANSFER"
}
export declare enum MovementTypeCode {
    IN_PURCHASE = "101",
    OUT_PRODUCTION = "201",
    IN_PRODUCTION_REV = "202",
    TRANSFER = "301",
    OUT_LOSS = "501",
    IN_LOSS_REV = "502",
    OUT_SALE = "601",
    IN_SALE_RETURN = "602"
}
export declare enum StockMovementType {
    IN_PURCHASE = "IN_PURCHASE",
    IN_RETURN = "IN_RETURN",
    IN_ADJUSTMENT = "IN_ADJUSTMENT",
    OUT_SALE = "OUT_SALE",
    OUT_RETURN = "OUT_RETURN",
    OUT_LOSS = "OUT_LOSS",
    OUT_ADJUSTMENT = "OUT_ADJUSTMENT"
}
export declare enum StockReferenceType {
    SALES_ORDER = "SALES_ORDER",
    PURCHASE_ORDER = "PURCHASE_ORDER",
    INVENTORY_ADJUSTMENT = "INVENTORY_ADJUSTMENT",
    MANUAL = "MANUAL"
}
export declare enum AccountCategoryType {
    REVENUE = "REVENUE",
    EXPENSE = "EXPENSE",
    ASSET = "ASSET",
    LIABILITY = "LIABILITY"
}
export declare enum FinancialRecordType {
    RECEIVABLE = "RECEIVABLE",
    PAYABLE = "PAYABLE"
}
export declare enum FinancialRecordStatus {
    PENDING = "PENDING",
    PARTIALLY_PAID = "PARTIALLY_PAID",
    PAID = "PAID",
    OVERDUE = "OVERDUE",
    CANCELLED = "CANCELLED"
}
export declare enum BankAccountType {
    CHECKING = "CHECKING",
    SAVINGS = "SAVINGS",
    INVESTMENT = "INVESTMENT",
    CASH_REGISTER = "CASH_REGISTER"
}
export declare enum BankTransactionType {
    CREDIT = "CREDIT",
    DEBIT = "DEBIT"
}
