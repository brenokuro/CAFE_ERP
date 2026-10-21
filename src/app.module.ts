// src/app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { SalesModule } from './modules/sales/sales.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { FinancialModule } from './modules/financial/financial.module';
import { BankingModule } from './modules/banking/banking.module';
import { StockModule } from './modules/stock/stock.module';
import { PrismaService } from './common/database/prisma.service';
import { TenantMiddleware } from './common/multitenancy/tenant.middleware';

@Module({
  imports: [
    AuthModule,
    ContactsModule,
    ProductsModule,
    CategoriesModule,
    SalesModule,
    PurchasesModule,
    FinancialModule,
    BankingModule,
    StockModule,
  ],
  providers: [PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplica o Middleware de Multi-tenancy globalmente em todas as rotas
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
