import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrincipalAdminGuard } from '../../common/guards/access-control';
import { AdminService } from './admin.service';
import { AssignLegacyRecordDto, CreateCenterDto, CreateManagedUserDto, UpdateCenterDto, UpdateUserAccessDto, UpdateUserStatusDto } from './dto/admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, PrincipalAdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('users') listUsers() { return this.admin.listUsers(); }
  @Post('users') createUser(@Body() dto: CreateManagedUserDto) { return this.admin.createUser(dto); }
  @Patch('users/:id/status') setUserStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserStatusDto) {
    return this.admin.setUserStatus(id, dto);
  }
  @Patch('users/:id/access') updateUserAccess(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserAccessDto) {
    return this.admin.updateUserAccess(id, dto);
  }

  @Get('centers') listCenters() { return this.admin.listCenters(true); }
  @Post('centers') createCenter(@Body() dto: CreateCenterDto) { return this.admin.createCenter(dto); }
  @Patch('centers/:id') updateCenter(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCenterDto) {
    return this.admin.updateCenter(id, dto);
  }

  @Get('audit-logs') listAuditLogs() { return this.admin.listAuditLogs(); }
  @Get('unassigned-records') listUnassigned() { return this.admin.listUnassigned(); }
  @Post('unassigned-records/:entity/:id/assign') assignLegacy(
    @Param('entity') entity: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignLegacyRecordDto,
  ) { return this.admin.assignLegacy(entity, id, dto); }
}

@Controller('centers')
@UseGuards(JwtAuthGuard)
export class CentersController {
  constructor(private readonly admin: AdminService) {}

  @Get()
  list() {
    // Membros recebem apenas centros atribuídos; a rota não aceita tenant/usuário do cliente.
    return this.admin.listMyCentersFromContext();
  }

  @Post()
  @UseGuards(PrincipalAdminGuard)
  create(@Body() dto: CreateCenterDto) { return this.admin.createCenter(dto); }
}
