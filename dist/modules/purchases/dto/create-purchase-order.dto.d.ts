export declare class CreatePurchaseOrderItemDto {
    productId: string;
    quantity: number;
    unitCost: number;
    discount?: number;
    otherExpenses?: number;
    notes?: string;
}
export declare class CreatePurchaseOrderDto {
    supplierId: string;
    invoiceKey?: string;
    invoiceSeries?: string;
    invoiceNumber?: string;
    xmlUrl?: string;
    arrivalDate?: string;
    totalDiscount?: number;
    totalFreight?: number;
    totalOtherExpenses?: number;
    notes?: string;
    receiveNow?: boolean;
    installmentsCount?: number;
    firstDueDate?: string;
    categoryAccountId?: string;
    items: CreatePurchaseOrderItemDto[];
}
