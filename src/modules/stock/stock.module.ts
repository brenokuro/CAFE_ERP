// src/modules/stock/stock.module.ts
import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { StockRepository } from './stock.repository';
import { PrismaService } from '../../common/database/prisma.service';

@Module({
  controllers: [StockController],
  providers: [StockService, StockRepository, PrismaService],
  exports: [StockService, StockRepository],
})
export class StockModule {}
