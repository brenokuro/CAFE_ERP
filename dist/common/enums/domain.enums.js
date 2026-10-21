"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankTransactionType = exports.BankAccountType = exports.FinancialRecordStatus = exports.FinancialRecordType = exports.AccountCategoryType = exports.StockReferenceType = exports.StockMovementType = exports.MovementTypeCode = exports.MovementDirection = exports.UnitOfMeasure = exports.PurchaseOrderStatus = exports.SalesOrderStatus = exports.ProductType = exports.ContactRole = exports.PersonType = exports.UserRole = exports.TenantStatus = exports.TaxRegime = void 0;
var TaxRegime;
(function (TaxRegime) {
    TaxRegime["MEI"] = "MEI";
    TaxRegime["SIMPLES_NACIONAL"] = "SIMPLES_NACIONAL";
    TaxRegime["SIMPLES_NACIONAL_EXCESSO"] = "SIMPLES_NACIONAL_EXCESSO";
    TaxRegime["LUCRO_PRESUMIDO"] = "LUCRO_PRESUMIDO";
    TaxRegime["LUCRO_REAL"] = "LUCRO_REAL";
})(TaxRegime || (exports.TaxRegime = TaxRegime = {}));
var TenantStatus;
(function (TenantStatus) {
    TenantStatus["ACTIVE"] = "ACTIVE";
    TenantStatus["SUSPENDED"] = "SUSPENDED";
    TenantStatus["CANCELLED"] = "CANCELLED";
})(TenantStatus || (exports.TenantStatus = TenantStatus = {}));
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["MANAGER"] = "MANAGER";
    UserRole["SALES"] = "SALES";
    UserRole["PURCHASING"] = "PURCHASING";
    UserRole["FINANCIAL"] = "FINANCIAL";
    UserRole["STOCK"] = "STOCK";
    UserRole["OPERATOR"] = "OPERATOR";
})(UserRole || (exports.UserRole = UserRole = {}));
var PersonType;
(function (PersonType) {
    PersonType["INDIVIDUAL"] = "INDIVIDUAL";
    PersonType["LEGAL_ENTITY"] = "LEGAL_ENTITY";
})(PersonType || (exports.PersonType = PersonType = {}));
var ContactRole;
(function (ContactRole) {
    ContactRole["CUSTOMER"] = "CUSTOMER";
    ContactRole["SUPPLIER"] = "SUPPLIER";
    ContactRole["BOTH"] = "BOTH";
})(ContactRole || (exports.ContactRole = ContactRole = {}));
var ProductType;
(function (ProductType) {
    ProductType["PRODUCT"] = "PRODUCT";
    ProductType["SERVICE"] = "SERVICE";
})(ProductType || (exports.ProductType = ProductType = {}));
var SalesOrderStatus;
(function (SalesOrderStatus) {
    SalesOrderStatus["DRAFT"] = "DRAFT";
    SalesOrderStatus["APPROVED"] = "APPROVED";
    SalesOrderStatus["INVOICED"] = "INVOICED";
    SalesOrderStatus["CANCELLED"] = "CANCELLED";
})(SalesOrderStatus || (exports.SalesOrderStatus = SalesOrderStatus = {}));
var PurchaseOrderStatus;
(function (PurchaseOrderStatus) {
    PurchaseOrderStatus["DRAFT"] = "DRAFT";
    PurchaseOrderStatus["APPROVED"] = "APPROVED";
    PurchaseOrderStatus["RECEIVED"] = "RECEIVED";
    PurchaseOrderStatus["CANCELLED"] = "CANCELLED";
})(PurchaseOrderStatus || (exports.PurchaseOrderStatus = PurchaseOrderStatus = {}));
var UnitOfMeasure;
(function (UnitOfMeasure) {
    UnitOfMeasure["UN"] = "UN";
    UnitOfMeasure["KG"] = "KG";
    UnitOfMeasure["G"] = "G";
    UnitOfMeasure["L"] = "L";
    UnitOfMeasure["ML"] = "ML";
    UnitOfMeasure["M"] = "M";
})(UnitOfMeasure || (exports.UnitOfMeasure = UnitOfMeasure = {}));
var MovementDirection;
(function (MovementDirection) {
    MovementDirection["IN"] = "IN";
    MovementDirection["OUT"] = "OUT";
    MovementDirection["TRANSFER"] = "TRANSFER";
})(MovementDirection || (exports.MovementDirection = MovementDirection = {}));
var MovementTypeCode;
(function (MovementTypeCode) {
    MovementTypeCode["IN_PURCHASE"] = "101";
    MovementTypeCode["OUT_PRODUCTION"] = "201";
    MovementTypeCode["IN_PRODUCTION_REV"] = "202";
    MovementTypeCode["TRANSFER"] = "301";
    MovementTypeCode["OUT_LOSS"] = "501";
    MovementTypeCode["IN_LOSS_REV"] = "502";
    MovementTypeCode["OUT_SALE"] = "601";
    MovementTypeCode["IN_SALE_RETURN"] = "602";
})(MovementTypeCode || (exports.MovementTypeCode = MovementTypeCode = {}));
var StockMovementType;
(function (StockMovementType) {
    StockMovementType["IN_PURCHASE"] = "IN_PURCHASE";
    StockMovementType["IN_RETURN"] = "IN_RETURN";
    StockMovementType["IN_ADJUSTMENT"] = "IN_ADJUSTMENT";
    StockMovementType["OUT_SALE"] = "OUT_SALE";
    StockMovementType["OUT_RETURN"] = "OUT_RETURN";
    StockMovementType["OUT_LOSS"] = "OUT_LOSS";
    StockMovementType["OUT_ADJUSTMENT"] = "OUT_ADJUSTMENT";
})(StockMovementType || (exports.StockMovementType = StockMovementType = {}));
var StockReferenceType;
(function (StockReferenceType) {
    StockReferenceType["SALES_ORDER"] = "SALES_ORDER";
    StockReferenceType["PURCHASE_ORDER"] = "PURCHASE_ORDER";
    StockReferenceType["INVENTORY_ADJUSTMENT"] = "INVENTORY_ADJUSTMENT";
    StockReferenceType["MANUAL"] = "MANUAL";
})(StockReferenceType || (exports.StockReferenceType = StockReferenceType = {}));
var AccountCategoryType;
(function (AccountCategoryType) {
    AccountCategoryType["REVENUE"] = "REVENUE";
    AccountCategoryType["EXPENSE"] = "EXPENSE";
    AccountCategoryType["ASSET"] = "ASSET";
    AccountCategoryType["LIABILITY"] = "LIABILITY";
})(AccountCategoryType || (exports.AccountCategoryType = AccountCategoryType = {}));
var FinancialRecordType;
(function (FinancialRecordType) {
    FinancialRecordType["RECEIVABLE"] = "RECEIVABLE";
    FinancialRecordType["PAYABLE"] = "PAYABLE";
})(FinancialRecordType || (exports.FinancialRecordType = FinancialRecordType = {}));
var FinancialRecordStatus;
(function (FinancialRecordStatus) {
    FinancialRecordStatus["PENDING"] = "PENDING";
    FinancialRecordStatus["PARTIALLY_PAID"] = "PARTIALLY_PAID";
    FinancialRecordStatus["PAID"] = "PAID";
    FinancialRecordStatus["OVERDUE"] = "OVERDUE";
    FinancialRecordStatus["CANCELLED"] = "CANCELLED";
})(FinancialRecordStatus || (exports.FinancialRecordStatus = FinancialRecordStatus = {}));
var BankAccountType;
(function (BankAccountType) {
    BankAccountType["CHECKING"] = "CHECKING";
    BankAccountType["SAVINGS"] = "SAVINGS";
    BankAccountType["INVESTMENT"] = "INVESTMENT";
    BankAccountType["CASH_REGISTER"] = "CASH_REGISTER";
})(BankAccountType || (exports.BankAccountType = BankAccountType = {}));
var BankTransactionType;
(function (BankTransactionType) {
    BankTransactionType["CREDIT"] = "CREDIT";
    BankTransactionType["DEBIT"] = "DEBIT";
})(BankTransactionType || (exports.BankTransactionType = BankTransactionType = {}));
//# sourceMappingURL=domain.enums.js.map