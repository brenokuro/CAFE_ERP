// frontend/src/services/api.ts
import {
  BankAccount,
  BankTransaction,
  CashFlowSummary,
  Contact,
  FinancialRecord,
  Product,
  PurchaseOrder,
  SalesOrder,
  StockMovement,
  Tenant,
  User,
} from '../types/erp.types';

// Dados iniciais representativos de PME real
const INITIAL_TENANT: Tenant = {
  id: 't-100',
  name: 'Comercial & Distribuidora Progresso Ltda',
  tradeName: 'Progresso Suprimentos',
  document: '14.285.714/0001-90',
  taxRegime: 'SIMPLES_NACIONAL',
  email: 'contato@progressosuprimentos.com.br',
  phone: '(11) 3450-9800',
};

const INITIAL_USER: User = {
  id: 'u-1',
  name: 'Carlos Alberto Mendonça',
  email: 'carlos@progressosuprimentos.com.br',
  role: 'ADMIN',
  tenantId: 't-100',
};

const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'c-1',
    name: 'TechLog Soluções em Informática S/A',
    tradeName: 'TechLog',
    personType: 'LEGAL_ENTITY',
    role: 'CUSTOMER',
    document: '08.412.390/0001-44',
    email: 'financeiro@techlog.com.br',
    phone: '(11) 4002-8922',
    city: 'São Paulo',
    state: 'SP',
    creditLimit: 25000,
    active: true,
  },
  {
    id: 'c-2',
    name: 'Fábrica de Embalagens Continental Eireli',
    tradeName: 'Continental Embalagens',
    personType: 'LEGAL_ENTITY',
    role: 'SUPPLIER',
    document: '19.822.401/0001-12',
    email: 'vendas@continentalembalagens.com.br',
    phone: '(19) 3881-2200',
    city: 'Campinas',
    state: 'SP',
    creditLimit: 50000,
    active: true,
  },
  {
    id: 'c-3',
    name: 'Roberto Miranda Consultoria & Engenharia',
    personType: 'INDIVIDUAL',
    role: 'CUSTOMER',
    document: '219.482.018-91',
    email: 'roberto@mirandaconsultoria.com',
    phone: '(11) 98711-4033',
    city: 'Santo André',
    state: 'SP',
    creditLimit: 10000,
    active: true,
  },
  {
    id: 'c-4',
    name: 'Papelaria & Distribuidora Delta Ltda',
    tradeName: 'Delta Papéis',
    personType: 'LEGAL_ENTITY',
    role: 'BOTH',
    document: '33.910.124/0001-50',
    email: 'contato@deltapapeis.com.br',
    phone: '(11) 2930-1122',
    city: 'São Bernardo',
    state: 'SP',
    creditLimit: 15000,
    active: true,
  },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p-1',
    sku: 'INF-001',
    name: 'Cabo de Rede UTP Cat6 305m Furukawa',
    type: 'PRODUCT',
    unit: 'CX',
    salePrice: 680.00,
    costPrice: 420.00,
    currentStock: 24,
    minStock: 10,
    ncm: '8544.49.00',
    active: true,
  },
  {
    id: 'p-2',
    sku: 'INF-002',
    name: 'Switch Gigabit 24 Portas Gerenciável L2',
    type: 'PRODUCT',
    unit: 'UN',
    salePrice: 1450.00,
    costPrice: 910.00,
    currentStock: 8,
    minStock: 5,
    ncm: '8517.62.59',
    active: true,
  },
  {
    id: 'p-3',
    sku: 'SUP-010',
    name: 'Toner Preto HP LaserJet Pro Alta Capacidade',
    type: 'PRODUCT',
    unit: 'UN',
    salePrice: 240.00,
    costPrice: 135.00,
    currentStock: 3, // Alerta: abaixo do estoque mínimo
    minStock: 8,
    ncm: '8443.99.23',
    active: true,
  },
  {
    id: 'p-4',
    sku: 'SRV-001',
    name: 'Serviço de Implantação e Certificação de Rede',
    type: 'SERVICE',
    unit: 'HR',
    unitOfMeasure: 'UN',
    isBatchControlled: false,
    salePrice: 180.00,
    costPrice: 0.00,
    currentStock: 0,
    minStock: 0,
    ncm: 'NBS-1020',
    active: true,
  },
  {
    id: 'p-5',
    sku: 'MAT-PLA-01',
    name: 'Filamento 3D PLA Premium 1.75mm Cinza Grafite',
    type: 'PRODUCT',
    unit: 'KG',
    unitOfMeasure: 'KG',
    isBatchControlled: true,
    salePrice: 165.0000,
    costPrice: 85.5000,
    currentStock: 14.7500,
    stockQuantity: 14.7500,
    minStock: 5.0000,
    ncm: '3916.90.90',
    active: true,
    batches: [
      {
        id: 'pb-1',
        tenantId: 'tenant-demo-1',
        productId: 'p-5',
        batchCode: 'LOT-PLA-2026-08',
        expirationDate: '2027-04-30',
        quantity: 9.5000,
        createdAt: '2026-01-10T10:00:00Z',
        updatedAt: '2026-01-10T10:00:00Z',
      },
      {
        id: 'pb-2',
        tenantId: 'tenant-demo-1',
        productId: 'p-5',
        batchCode: 'LOT-PLA-2026-09',
        expirationDate: '2027-08-15',
        quantity: 5.2500,
        createdAt: '2026-02-15T14:30:00Z',
        updatedAt: '2026-02-15T14:30:00Z',
      },
    ],
  },
  {
    id: 'p-6',
    sku: 'INS-RES-02',
    name: 'Resina Fotopolímero UV 405nm Alta Precisão',
    type: 'PRODUCT',
    unit: 'L',
    unitOfMeasure: 'L',
    isBatchControlled: true,
    salePrice: 289.0000,
    costPrice: 142.2500,
    currentStock: 8.3500,
    stockQuantity: 8.3500,
    minStock: 3.0000,
    ncm: '3907.30.29',
    active: true,
    batches: [
      {
        id: 'pb-3',
        tenantId: 'tenant-demo-1',
        productId: 'p-6',
        batchCode: 'LOT-RES-26B',
        expirationDate: '2026-11-20',
        quantity: 8.3500,
        createdAt: '2026-03-01T09:00:00Z',
        updatedAt: '2026-03-01T09:00:00Z',
      },
    ],
  },
];

const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'b-1',
    name: 'Itaú Empresas - Conta Corrente',
    bankCode: '341',
    bankName: 'Banco Itaú S.A.',
    agency: '0812',
    accountNumber: '92814-1',
    accountType: 'CHECKING',
    currentBalance: 42850.20,
    active: true,
  },
  {
    id: 'b-2',
    name: 'Banco do Brasil - Conta Operacional',
    bankCode: '001',
    bankName: 'Banco do Brasil',
    agency: '1240',
    accountNumber: '44210-9',
    accountType: 'CHECKING',
    currentBalance: 18400.00,
    active: true,
  },
  {
    id: 'b-3',
    name: 'Caixa Físico Loja / Gaveta',
    accountType: 'CASH_REGISTER',
    currentBalance: 3250.00,
    active: true,
  },
];

const INITIAL_SALES_ORDERS: SalesOrder[] = [
  {
    id: 'so-101',
    orderNumber: 1001,
    customerId: 'c-1',
    customer: INITIAL_CONTACTS[0],
    status: 'INVOICED',
    issueDate: '2026-10-18',
    deliveryDate: '2026-10-20',
    totalGross: 4310.00,
    totalDiscount: 110.00,
    totalFreight: 50.00,
    totalNet: 4250.00,
    notes: 'Entregar em horário comercial na filial Lapa.',
    items: [
      {
        id: 'soi-1',
        productId: 'p-1',
        product: INITIAL_PRODUCTS[0],
        quantity: 2,
        unitPrice: 680.00,
        discount: 0,
        totalPrice: 1360.00,
      },
      {
        id: 'soi-2',
        productId: 'p-2',
        product: INITIAL_PRODUCTS[1],
        quantity: 2,
        unitPrice: 1450.00,
        discount: 110.00,
        totalPrice: 2790.00,
      },
    ],
  },
  {
    id: 'so-102',
    orderNumber: 1002,
    customerId: 'c-3',
    customer: INITIAL_CONTACTS[2],
    status: 'DRAFT',
    issueDate: '2026-10-20',
    deliveryDate: '2026-10-23',
    totalGross: 1360.00,
    totalDiscount: 0,
    totalFreight: 0,
    totalNet: 1360.00,
    notes: 'Aguardando aprovação de orçamento pela diretoria.',
    items: [
      {
        id: 'soi-3',
        productId: 'p-1',
        product: INITIAL_PRODUCTS[0],
        quantity: 2,
        unitPrice: 680.00,
        discount: 0,
        totalPrice: 1360.00,
      },
    ],
  },
];

const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-201',
    orderNumber: 2001,
    supplierId: 'c-2',
    supplier: INITIAL_CONTACTS[1],
    status: 'RECEIVED',
    invoiceKey: '35261019822401000112550010000491021982341012',
    invoiceNumber: '000.049.102',
    issueDate: '2026-10-15',
    totalGross: 4200.00,
    totalFreight: 120.00,
    totalNet: 4320.00,
    items: [
      {
        id: 'poi-1',
        productId: 'p-1',
        product: INITIAL_PRODUCTS[0],
        quantity: 10,
        unitCost: 420.00,
        discount: 0,
        totalCost: 4200.00,
      },
    ],
  },
];

const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'sm-1',
    productId: 'p-5',
    batchId: 'pb-1',
    movementTypeCode: '201',
    product: { sku: 'MAT-PLA-01', name: 'Filamento 3D PLA Premium 1.75mm Cinza Grafite', unitOfMeasure: 'KG' },
    batch: { batchCode: 'LOT-PLA-2026-08', expirationDate: '2027-04-30' },
    type: 'OUT_LOSS',
    quantity: 1.2500,
    previousStock: 16.0000,
    currentStock: 14.7500,
    newStock: 14.7500,
    unitCost: 85.5000,
    totalCost: 106.8750,
    documentNumber: 'OP-2026-089',
    reason: 'Consumo para impressão 3D de carcaça técnica industrial',
    referenceType: 'MANUAL',
    createdAt: '2026-10-20T16:40:00Z',
    createdByUser: { name: 'Carlos Alberto Mendonça' },
  },
  {
    id: 'sm-2',
    productId: 'p-5',
    batchId: 'pb-1',
    movementTypeCode: '501',
    product: { sku: 'MAT-PLA-01', name: 'Filamento 3D PLA Premium 1.75mm Cinza Grafite', unitOfMeasure: 'KG' },
    batch: { batchCode: 'LOT-PLA-2026-08', expirationDate: '2027-04-30' },
    type: 'OUT_LOSS',
    quantity: 0.3500,
    previousStock: 16.3500,
    currentStock: 16.0000,
    newStock: 16.0000,
    unitCost: 85.5000,
    totalCost: 29.9250,
    documentNumber: 'AVARIA-104',
    reason: 'Filamento úmido / ponta quebrada no extrusor',
    referenceType: 'MANUAL',
    createdAt: '2026-10-19T11:20:00Z',
    createdByUser: { name: 'Carlos Alberto Mendonça' },
  },
  {
    id: 'sm-3',
    productId: 'p-6',
    batchId: 'pb-3',
    movementTypeCode: '101',
    product: { sku: 'INS-RES-02', name: 'Resina Fotopolímero UV 405nm Alta Precisão', unitOfMeasure: 'L' },
    batch: { batchCode: 'LOT-RES-26B', expirationDate: '2026-11-20' },
    type: 'IN_PURCHASE',
    quantity: 10.0000,
    previousStock: 0.0000,
    currentStock: 10.0000,
    newStock: 10.0000,
    unitCost: 142.2500,
    totalCost: 1422.50,
    documentNumber: 'NF-004812',
    reason: 'Entrada de compra - Fornecedor Químico Delta',
    referenceType: 'PURCHASE_ORDER',
    createdAt: '2026-10-18T09:30:00Z',
    createdByUser: { name: 'Carlos Alberto Mendonça' },
  },
  {
    id: 'sm-4',
    productId: 'p-1',
    movementTypeCode: '601',
    product: { sku: 'INF-001', name: 'Cabo de Rede UTP Cat6 305m Furukawa', unitOfMeasure: 'UN' },
    type: 'OUT_SALE',
    quantity: 2.0000,
    previousStock: 26.0000,
    currentStock: 24.0000,
    newStock: 24.0000,
    unitCost: 420.00,
    totalCost: 840.00,
    documentNumber: 'PV-1001',
    referenceType: 'SALES_ORDER',
    referenceId: 'so-101',
    createdAt: '2026-10-18T10:15:00Z',
    createdByUser: { name: 'Carlos Alberto Mendonça' },
  },
];

const INITIAL_FINANCIAL_RECORDS: FinancialRecord[] = [
  {
    id: 'fr-1',
    type: 'RECEIVABLE',
    status: 'PENDING',
    description: 'Venda #1001 - Parcela 1/2',
    contactId: 'c-1',
    contact: { name: 'TechLog Soluções em Informática S/A', document: '08.412.390/0001-44' },
    dueDate: '2026-11-18',
    issueDate: '2026-10-18',
    originalAmount: 2125.00,
    paidAmount: 0,
    balanceAmount: 2125.00,
    installmentNumber: 1,
    totalInstallments: 2,
    salesOrderId: 'so-101',
  },
  {
    id: 'fr-2',
    type: 'RECEIVABLE',
    status: 'PENDING',
    description: 'Venda #1001 - Parcela 2/2',
    contactId: 'c-1',
    contact: { name: 'TechLog Soluções em Informática S/A', document: '08.412.390/0001-44' },
    dueDate: '2026-12-18',
    issueDate: '2026-10-18',
    originalAmount: 2125.00,
    paidAmount: 0,
    balanceAmount: 2125.00,
    installmentNumber: 2,
    totalInstallments: 2,
    salesOrderId: 'so-101',
  },
  {
    id: 'fr-3',
    type: 'PAYABLE',
    status: 'PENDING',
    description: 'Compra Fornecedor - Pedido #2001 (NF-e 000.049.102)',
    contactId: 'c-2',
    contact: { name: 'Fábrica de Embalagens Continental Eireli' },
    dueDate: '2026-11-15',
    issueDate: '2026-10-15',
    originalAmount: 4320.00,
    paidAmount: 0,
    balanceAmount: 4320.00,
    installmentNumber: 1,
    totalInstallments: 1,
    purchaseOrderId: 'po-201',
  },
  {
    id: 'fr-4',
    type: 'PAYABLE',
    status: 'PENDING',
    description: 'Despesa Operacional - Aluguel Galpão Comercial',
    contactId: 'c-4',
    contact: { name: 'Papelaria & Distribuidora Delta Ltda' },
    dueDate: '2026-10-25',
    issueDate: '2026-10-01',
    originalAmount: 3800.00,
    paidAmount: 0,
    balanceAmount: 3800.00,
    installmentNumber: 1,
    totalInstallments: 1,
  },
];

const INITIAL_BANK_TRANSACTIONS: BankTransaction[] = [
  {
    id: 'bt-1',
    bankAccountId: 'b-1',
    type: 'CREDIT',
    amount: 2125.00,
    transactionDate: '2026-10-20',
    description: 'PIX RECEBIDO - TECHLOG SOLUCOES CNPJ: 08.412.390/0001-44',
    reconciled: false,
    externalReferenceId: 'E00412390202610201402k882',
  },
  {
    id: 'bt-2',
    bankAccountId: 'b-1',
    type: 'DEBIT',
    amount: 3800.00,
    transactionDate: '2026-10-20',
    description: 'PAGTO TITULO ITAU - DELTA IMOBILIARIA',
    reconciled: false,
    externalReferenceId: 'DOC-8891024',
  },
  {
    id: 'bt-3',
    bankAccountId: 'b-2',
    type: 'CREDIT',
    amount: 5400.00,
    transactionDate: '2026-10-19',
    description: 'TED RECEBIDA - CLIENTE DIVERSO SÃO PAULO',
    reconciled: true,
    reconciledAt: '2026-10-19T17:00:00Z',
    externalReferenceId: 'TED-09281',
  },
];

class ErpDataStore {
  tenant: Tenant = INITIAL_TENANT;
  user: User = INITIAL_USER;
  contacts: Contact[] = [...INITIAL_CONTACTS];
  products: Product[] = [...INITIAL_PRODUCTS];
  bankAccounts: BankAccount[] = [...INITIAL_BANK_ACCOUNTS];
  salesOrders: SalesOrder[] = [...INITIAL_SALES_ORDERS];
  purchaseOrders: PurchaseOrder[] = [...INITIAL_PURCHASE_ORDERS];
  stockMovements: StockMovement[] = [...INITIAL_STOCK_MOVEMENTS];
  financialRecords: FinancialRecord[] = [...INITIAL_FINANCIAL_RECORDS];
  bankTransactions: BankTransaction[] = [...INITIAL_BANK_TRANSACTIONS];

  // =========================================================================
  // VENDAS & FATURAMENTO (Efeito Cascata ACID)
  // =========================================================================
  createSalesOrder(data: {
    customerId: string;
    items: { productId: string; quantity: number; unitPrice: number; discount?: number }[];
    approveNow?: boolean;
    installmentsCount?: number;
    deliveryDate?: string;
    notes?: string;
  }): SalesOrder {
    const customer = this.contacts.find((c) => c.id === data.customerId);
    if (!customer) throw new Error('Cliente não encontrado.');

    let gross = 0;
    const orderItems = data.items.map((item, idx) => {
      const product = this.products.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Produto não encontrado: ${item.productId}`);
      const lineGross = item.quantity * item.unitPrice;
      const lineDiscount = item.discount || 0;
      gross += lineGross;
      return {
        id: `soi-${Date.now()}-${idx}`,
        productId: product.id,
        product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: lineDiscount,
        totalPrice: lineGross - lineDiscount,
      };
    });

    const net = gross;
    const orderNumber = 1000 + this.salesOrders.length + 1;
    const newOrder: SalesOrder = {
      id: `so-${Date.now()}`,
      orderNumber,
      customerId: customer.id,
      customer,
      status: data.approveNow ? 'INVOICED' : 'DRAFT',
      issueDate: new Date().toISOString().split('T')[0],
      deliveryDate: data.deliveryDate,
      totalGross: gross,
      totalDiscount: 0,
      totalFreight: 0,
      totalNet: net,
      notes: data.notes,
      items: orderItems,
    };

    // Efeito cascata se faturado
    if (data.approveNow) {
      this.executeSalesCascade(newOrder, data.installmentsCount || 1);
    }

    this.salesOrders.unshift(newOrder);
    return newOrder;
  }

  invoiceSalesOrder(orderId: string, installmentsCount: number = 1): SalesOrder {
    const order = this.salesOrders.find((o) => o.id === orderId);
    if (!order) throw new Error('Pedido de venda não encontrado.');
    if (order.status === 'INVOICED') throw new Error('Este pedido já foi faturado.');

    this.executeSalesCascade(order, installmentsCount);
    order.status = 'INVOICED';
    return order;
  }

  private executeSalesCascade(order: SalesOrder, installmentsCount: number) {
    // 1. Validação de estoque para todos os produtos
    for (const item of order.items) {
      const product = this.products.find((p) => p.id === item.productId);
      if (product && product.type === 'PRODUCT') {
        if (product.currentStock < item.quantity) {
          throw new Error(
            `Saldo insuficiente para o produto "${product.name}". Disponível: ${product.currentStock}, Solicitado: ${item.quantity}.`,
          );
        }
      }
    }

    // 2. Baixa de estoque e movimentação auditável
    for (const item of order.items) {
      const product = this.products.find((p) => p.id === item.productId);
      if (product && product.type === 'PRODUCT') {
        const prev = product.currentStock;
        const cur = prev - item.quantity;
        product.currentStock = cur;

        this.stockMovements.unshift({
          id: `sm-${Date.now()}-${item.productId}`,
          productId: product.id,
          product: { sku: product.sku, name: product.name },
          type: 'OUT_SALE',
          quantity: item.quantity,
          previousStock: prev,
          currentStock: cur,
          unitCost: product.costPrice,
          totalCost: item.quantity * product.costPrice,
          referenceType: 'SALES_ORDER',
          referenceId: order.id,
          createdAt: new Date().toISOString(),
          createdByUser: { name: this.user.name },
        });
      }
    }

    // 3. Geração de parcelas no Contas a Receber
    const installments = Math.max(1, installmentsCount);
    const baseAmount = Math.floor((order.totalNet / installments) * 100) / 100;
    const remainder = Number((order.totalNet - baseAmount * installments).toFixed(2));

    for (let i = 1; i <= installments; i++) {
      const due = new Date();
      due.setDate(due.getDate() + i * 30);
      const isLast = i === installments;
      const amount = isLast ? baseAmount + remainder : baseAmount;

      this.financialRecords.unshift({
        id: `fr-${Date.now()}-${i}`,
        type: 'RECEIVABLE',
        status: 'PENDING',
        description: `Venda #${order.orderNumber} - Parcela ${i}/${installments}`,
        contactId: order.customerId,
        contact: { name: order.customer?.name || 'Cliente', document: order.customer?.document },
        dueDate: due.toISOString().split('T')[0],
        issueDate: order.issueDate,
        originalAmount: amount,
        paidAmount: 0,
        balanceAmount: amount,
        installmentNumber: i,
        totalInstallments: installments,
        salesOrderId: order.id,
      });
    }
  }

  // =========================================================================
  // COMPRAS & ENTRADA DE NOTAS (Recálculo de Custo Médio e Contas a Pagar)
  // =========================================================================
  createPurchaseOrder(data: {
    supplierId: string;
    items: { productId: string; quantity: number; unitCost: number }[];
    invoiceKey?: string;
    invoiceNumber?: string;
    receiveNow?: boolean;
    installmentsCount?: number;
  }): PurchaseOrder {
    const supplier = this.contacts.find((c) => c.id === data.supplierId);
    if (!supplier) throw new Error('Fornecedor não encontrado.');

    let gross = 0;
    const items = data.items.map((item, idx) => {
      const product = this.products.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Produto não encontrado: ${item.productId}`);
      const lineCost = item.quantity * item.unitCost;
      gross += lineCost;
      return {
        id: `poi-${Date.now()}-${idx}`,
        productId: product.id,
        product,
        quantity: item.quantity,
        unitCost: item.unitCost,
        discount: 0,
        totalCost: lineCost,
      };
    });

    const orderNumber = 2000 + this.purchaseOrders.length + 1;
    const newPurchase: PurchaseOrder = {
      id: `po-${Date.now()}`,
      orderNumber,
      supplierId: supplier.id,
      supplier,
      status: data.receiveNow ? 'RECEIVED' : 'DRAFT',
      invoiceKey: data.invoiceKey,
      invoiceNumber: data.invoiceNumber || `000.${Math.floor(100000 + Math.random() * 900000)}`,
      issueDate: new Date().toISOString().split('T')[0],
      totalGross: gross,
      totalFreight: 0,
      totalNet: gross,
      items,
    };

    if (data.receiveNow) {
      this.executePurchaseCascade(newPurchase, data.installmentsCount || 1);
    }

    this.purchaseOrders.unshift(newPurchase);
    return newPurchase;
  }

  receivePurchaseOrder(purchaseId: string, installmentsCount: number = 1): PurchaseOrder {
    const purchase = this.purchaseOrders.find((p) => p.id === purchaseId);
    if (!purchase) throw new Error('Compra não encontrada.');
    if (purchase.status === 'RECEIVED') throw new Error('Esta compra já foi recebida.');

    this.executePurchaseCascade(purchase, installmentsCount);
    purchase.status = 'RECEIVED';
    return purchase;
  }

  private executePurchaseCascade(purchase: PurchaseOrder, installmentsCount: number) {
    for (const item of purchase.items) {
      const product = this.products.find((p) => p.id === item.productId);
      if (product && product.type === 'PRODUCT') {
        const prevStock = product.currentStock;
        const newStock = prevStock + item.quantity;

        // Recálculo do Custo Médio Ponderado (CMP)
        let newCost = item.unitCost;
        if (newStock > 0) {
          const currentTotalVal = prevStock * product.costPrice;
          const incomingTotalVal = item.quantity * item.unitCost;
          newCost = Number(((currentTotalVal + incomingTotalVal) / newStock).toFixed(4));
        }

        product.currentStock = newStock;
        product.costPrice = newCost;

        this.stockMovements.unshift({
          id: `sm-${Date.now()}-${item.productId}`,
          productId: product.id,
          product: { sku: product.sku, name: product.name },
          type: 'IN_PURCHASE',
          quantity: item.quantity,
          previousStock: prevStock,
          currentStock: newStock,
          unitCost: item.unitCost,
          totalCost: item.quantity * item.unitCost,
          referenceType: 'PURCHASE_ORDER',
          referenceId: purchase.id,
          createdAt: new Date().toISOString(),
          createdByUser: { name: this.user.name },
        });
      }
    }

    // Contas a Pagar
    const installments = Math.max(1, installmentsCount);
    const amount = Number((purchase.totalNet / installments).toFixed(2));
    for (let i = 1; i <= installments; i++) {
      const due = new Date();
      due.setDate(due.getDate() + i * 30);

      this.financialRecords.unshift({
        id: `fr-${Date.now()}-${i}`,
        type: 'PAYABLE',
        status: 'PENDING',
        description: `Compra #${purchase.orderNumber} (NF-e ${purchase.invoiceNumber}) - Parcela ${i}/${installments}`,
        contactId: purchase.supplierId,
        contact: { name: purchase.supplier?.name || 'Fornecedor' },
        dueDate: due.toISOString().split('T')[0],
        issueDate: purchase.issueDate,
        originalAmount: amount,
        paidAmount: 0,
        balanceAmount: amount,
        installmentNumber: i,
        totalInstallments: installments,
        purchaseOrderId: purchase.id,
      });
    }
  }

  // =========================================================================
  // FINANCEIRO, LIQUIDAÇÃO & CONCILIAÇÃO BANCÁRIA
  // =========================================================================
  settleRecord(recordId: string, bankAccountId: string, amount: number): FinancialRecord {
    const record = this.financialRecords.find((r) => r.id === recordId);
    if (!record) throw new Error('Título não encontrado.');
    const account = this.bankAccounts.find((b) => b.id === bankAccountId);
    if (!account) throw new Error('Conta bancária não encontrada.');

    if (amount > record.balanceAmount) {
      throw new Error('Valor da liquidação é superior ao saldo em aberto.');
    }

    record.paidAmount += amount;
    record.balanceAmount -= amount;
    record.status = record.balanceAmount <= 0 ? 'PAID' : 'PARTIALLY_PAID';

    // Movimentação na conta
    if (record.type === 'RECEIVABLE') {
      account.currentBalance += amount;
    } else {
      account.currentBalance -= amount;
    }

    // Cria registro de extrato
    this.bankTransactions.unshift({
      id: `bt-${Date.now()}`,
      bankAccountId: account.id,
      type: record.type === 'RECEIVABLE' ? 'CREDIT' : 'DEBIT',
      amount,
      transactionDate: new Date().toISOString().split('T')[0],
      description: `Liquidação ${record.type === 'RECEIVABLE' ? 'Recebimento' : 'Pagamento'}: ${record.description}`,
      reconciled: true,
      reconciledAt: new Date().toISOString(),
      financialRecordId: record.id,
    });

    return record;
  }

  reconcile(bankTransactionId: string, financialRecordId: string) {
    const tx = this.bankTransactions.find((t) => t.id === bankTransactionId);
    if (!tx) throw new Error('Transação bancária não encontrada.');
    if (tx.reconciled) throw new Error('Transação já conciliada.');

    const record = this.financialRecords.find((r) => r.id === financialRecordId);
    if (!record) throw new Error('Título financeiro não encontrado.');

    if (record.type === 'RECEIVABLE' && tx.type !== 'CREDIT') {
      throw new Error('Título a Receber requer transação de CRÉDITO.');
    }
    if (record.type === 'PAYABLE' && tx.type !== 'DEBIT') {
      throw new Error('Título a Pagar requer transação de DÉBITO.');
    }

    const amortized = Math.min(tx.amount, record.balanceAmount);
    record.paidAmount += amortized;
    record.balanceAmount -= amortized;
    record.status = record.balanceAmount <= 0 ? 'PAID' : 'PARTIALLY_PAID';

    tx.reconciled = true;
    tx.reconciledAt = new Date().toISOString();
    tx.financialRecordId = record.id;

    return { success: true, transaction: tx, record };
  }

  getCashFlowSummary(): CashFlowSummary {
    const totalBankBalance = this.bankAccounts.reduce((acc, b) => acc + b.currentBalance, 0);

    let totalPendingReceivables = 0;
    let totalPendingPayables = 0;
    let totalRealizedRevenues = 0;
    let totalRealizedExpenses = 0;

    const today = new Date();
    const dailyMap = new Map<string, { date: string; inflow: number; outflow: number }>();

    for (const record of this.financialRecords) {
      if (record.type === 'RECEIVABLE') {
        totalRealizedRevenues += record.paidAmount;
        totalPendingReceivables += record.balanceAmount;
      } else {
        totalRealizedExpenses += record.paidAmount;
        totalPendingPayables += record.balanceAmount;
      }

      if (record.status !== 'PAID' && record.status !== 'CANCELLED') {
        const d = record.dueDate;
        if (!dailyMap.has(d)) {
          dailyMap.set(d, { date: d, inflow: 0, outflow: 0 });
        }
        const item = dailyMap.get(d)!;
        if (record.type === 'RECEIVABLE') {
          item.inflow += record.balanceAmount;
        } else {
          item.outflow += record.balanceAmount;
        }
      }
    }

    const netProjected = totalPendingReceivables - totalPendingPayables;
    let running = totalBankBalance;

    const dailyTimeline = Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => {
        const netDaily = item.inflow - item.outflow;
        running += netDaily;
        return {
          date: item.date,
          expectedInflow: item.inflow,
          expectedOutflow: item.outflow,
          netDaily,
          projectedRunningBalance: running,
        };
      });

    return {
      period: {
        startDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0],
      },
      summary: {
        currentAvailableBalance: totalBankBalance,
        totalRealizedRevenues,
        totalRealizedExpenses,
        totalProjectedReceivables: totalPendingReceivables,
        totalProjectedPayables: totalPendingPayables,
        netProjectedFlow: netProjected,
        finalProjectedBalance: totalBankBalance + netProjected,
      },
      bankAccounts: this.bankAccounts.map((b) => ({ id: b.id, name: b.name, balance: b.currentBalance })),
      dailyTimeline,
    };
  }
}

export const erpStore = new ErpDataStore();
