// frontend/src/types/erp.types.ts

export type SalesOrderStatus = 'DRAFT' | 'APPROVED' | 'INVOICED' | 'CANCELLED';
export type PurchaseOrderStatus = 'DRAFT' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';
export type FinancialRecordType = 'RECEIVABLE' | 'PAYABLE';
export type FinancialRecordStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type StockMovementType = 'IN_PURCHASE' | 'IN_RETURN' | 'IN_ADJUSTMENT' | 'OUT_SALE' | 'OUT_RETURN' | 'OUT_LOSS' | 'OUT_ADJUSTMENT';
export type ProductType = 'PRODUCT' | 'SERVICE';
export type ContactRole = 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
export type PersonType = 'INDIVIDUAL' | 'LEGAL_ENTITY';
export type BankAccountType = 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'CASH_REGISTER';
export type BankTransactionType = 'CREDIT' | 'DEBIT';

export interface Tenant {
  id: string;
  name: string;
  tradeName?: string;
  document: string; // CNPJ/CPF
  taxRegime: string;
  email: string;
  phone?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'SALES' | 'PURCHASING' | 'FINANCIAL' | 'STOCK' | 'OPERATOR';
  tenantId: string;
}

export interface Contact {
  id: string;
  name: string;
  tradeName?: string;
  personType: PersonType;
  role: ContactRole;
  document?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  creditLimit?: number;
  active: boolean;
}

export type UnitOfMeasure = 'UN' | 'KG' | 'G' | 'L' | 'ML' | 'M';

export interface ProductBatch {
  id: string;
  tenantId: string;
  productId: string;
  batchCode: string;
  expirationDate?: string | null;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  type: ProductType;
  unit: string;
  unitOfMeasure?: UnitOfMeasure;
  isBatchControlled?: boolean;
  salePrice: number;
  costPrice: number;
  currentStock: number;
  stockQuantity?: number;
  minStock: number;
  ncm?: string;
  active: boolean;
  batches?: ProductBatch[];
}

export interface SalesOrderItem {
  id?: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: number;
  customerId: string;
  customer?: Contact;
  status: SalesOrderStatus;
  issueDate: string;
  deliveryDate?: string;
  totalGross: number;
  totalDiscount: number;
  totalFreight: number;
  totalNet: number;
  notes?: string;
  items: SalesOrderItem[];
}

export interface PurchaseOrderItem {
  id?: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitCost: number;
  discount: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: number;
  supplierId: string;
  supplier?: Contact;
  status: PurchaseOrderStatus;
  invoiceKey?: string;
  invoiceNumber?: string;
  issueDate: string;
  totalGross: number;
  totalFreight: number;
  totalNet: number;
  items: PurchaseOrderItem[];
}

export interface StockMovement {
  id: string;
  productId: string;
  batchId?: string;
  movementTypeCode?: string;
  product?: { sku: string; name: string; unitOfMeasure?: string };
  batch?: { batchCode: string; expirationDate?: string | null };
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  currentStock: number;
  newStock?: number;
  unitCost?: number;
  totalCost?: number;
  documentNumber?: string;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  createdAt: string;
  createdByUser?: { name: string };
}

export interface FinancialRecord {
  id: string;
  type: FinancialRecordType;
  status: FinancialRecordStatus;
  description: string;
  contactId?: string;
  contact?: { name: string; document?: string };
  dueDate: string;
  issueDate: string;
  originalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  installmentNumber: number;
  totalInstallments: number;
  salesOrderId?: string;
  purchaseOrderId?: string;
}

export interface BankAccount {
  id: string;
  name: string;
  bankCode?: string;
  bankName?: string;
  agency?: string;
  accountNumber?: string;
  accountType: BankAccountType;
  currentBalance: number;
  active: boolean;
}

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  type: BankTransactionType;
  amount: number;
  transactionDate: string;
  description: string;
  reconciled: boolean;
  reconciledAt?: string;
  financialRecordId?: string;
  externalReferenceId?: string;
}

export interface CashFlowSummary {
  period: { startDate: string; endDate: string };
  summary: {
    currentAvailableBalance: number;
    totalRealizedRevenues: number;
    totalRealizedExpenses: number;
    totalProjectedReceivables: number;
    totalProjectedPayables: number;
    netProjectedFlow: number;
    finalProjectedBalance: number;
  };
  bankAccounts: { id: string; name: string; balance: number }[];
  dailyTimeline: {
    date: string;
    expectedInflow: number;
    expectedOutflow: number;
    netDaily: number;
    projectedRunningBalance: number;
  }[];
}
