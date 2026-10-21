// src/modules/banking/banking.module.ts
import { Module } from '@nestjs/common';
import { BankingService } from './banking.service';
import { BankingController } from './banking.controller';
import { PrismaService } from '../../common/database/prisma.service';

@Module({
  controllers: [BankingController],
  providers: [BankingService, PrismaService],
  exports: [BankingService],
})
export class BankingModule {}
