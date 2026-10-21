export declare class CreateSalesOrderItemDto {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    notes?: string;
}
export declare class CreateSalesOrderDto {
    customerId: string;
    deliveryDate?: string;
    paymentTerm?: string;
    totalDiscount?: number;
    totalFreight?: number;
    notes?: string;
    approveNow?: boolean;
    installmentsCount?: number;
    firstDueDate?: string;
    categoryAccountId?: string;
    items: CreateSalesOrderItemDto[];
}
