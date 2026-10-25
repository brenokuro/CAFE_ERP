"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("./modules/auth/auth.module");
const contacts_module_1 = require("./modules/contacts/contacts.module");
const products_module_1 = require("./modules/products/products.module");
const categories_module_1 = require("./modules/categories/categories.module");
const sales_module_1 = require("./modules/sales/sales.module");
const purchases_module_1 = require("./modules/purchases/purchases.module");
const financial_module_1 = require("./modules/financial/financial.module");
const banking_module_1 = require("./modules/banking/banking.module");
const stock_module_1 = require("./modules/stock/stock.module");
const prisma_service_1 = require("./common/database/prisma.service");
const tenant_middleware_1 = require("./common/multitenancy/tenant.middleware");
const access_module_1 = require("./common/guards/access.module");
const admin_module_1 = require("./modules/admin/admin.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(tenant_middleware_1.TenantMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            access_module_1.AccessModule,
            admin_module_1.AdminModule,
            auth_module_1.AuthModule,
            contacts_module_1.ContactsModule,
            products_module_1.ProductsModule,
            categories_module_1.CategoriesModule,
            sales_module_1.SalesModule,
            purchases_module_1.PurchasesModule,
            financial_module_1.FinancialModule,
            banking_module_1.BankingModule,
            stock_module_1.StockModule,
        ],
        providers: [prisma_service_1.PrismaService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map