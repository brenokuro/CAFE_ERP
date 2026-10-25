import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { AdminController, CentersController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController, CentersController],
  providers: [AdminService, PrismaService],
})
export class AdminModule {}
