import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CenterAccessGuard, PrincipalAdminGuard, RolesGuard } from './access-control';

@Global()
@Module({
  providers: [PrismaService, CenterAccessGuard, PrincipalAdminGuard, RolesGuard],
  exports: [CenterAccessGuard, PrincipalAdminGuard, RolesGuard],
})
export class AccessModule {}
