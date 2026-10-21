// src/modules/purchases/purchases.module.ts
import { Module } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { PrismaService } from '../../common/database/prisma.service';

@Module({
  controllers: [PurchasesController],
  providers: [PurchasesService, PrismaService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
