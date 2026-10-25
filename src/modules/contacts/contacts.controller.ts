// src/modules/contacts/contacts.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ContactRole } from '../../common/enums/domain.enums';
import { CenterAccessGuard, Roles, RolesGuard } from '../../common/guards/access-control';
import { UserRole } from '../../common/enums/domain.enums';

@Controller('contacts')
@UseGuards(JwtAuthGuard, CenterAccessGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.PURCHASING, UserRole.FINANCIAL, UserRole.STOCK, UserRole.OPERATOR)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.PURCHASING)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateContactDto) {
    return this.contactsService.create(dto);
  }

  @Get()
  async findAll(
    @Query('role') role?: ContactRole,
    @Query('search') search?: string,
  ) {
    return this.contactsService.findAll(role, search);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.contactsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.PURCHASING)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.PURCHASING)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.contactsService.remove(id);
  }
}
