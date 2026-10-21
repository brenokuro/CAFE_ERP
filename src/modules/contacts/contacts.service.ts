// src/modules/contacts/contacts.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { TenantContextService } from '../../common/multitenancy/tenant-context.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactRole } from '../../common/enums/domain.enums';
import { Prisma } from '@prisma/client';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo contato (Cliente, Fornecedor ou Ambos) garantindo isolamento por Tenant.
   */
  async create(dto: CreateContactDto) {
    const tenantId = TenantContextService.getTenantId();

    return this.prisma.client.contact.create({
      data: {
        tenantId,
        personType: dto.personType,
        role: dto.role,
        name: dto.name,
        tradeName: dto.tradeName,
        document: dto.document,
        stateRegistration: dto.stateRegistration,
        municipalRegistration: dto.municipalRegistration,
        email: dto.email,
        phone: dto.phone,
        mobile: dto.mobile,
        street: dto.street,
        number: dto.number,
        complement: dto.complement,
        neighborhood: dto.neighborhood,
        city: dto.city,
        state: dto.state,
        zipCode: dto.zipCode,
        creditLimit: dto.creditLimit !== undefined ? new Prisma.Decimal(dto.creditLimit) : null,
        notes: dto.notes,
        active: dto.active ?? true,
      },
    });
  }

  /**
   * Lista contatos com filtros opcionais por papel (role) e busca textual.
   */
  async findAll(role?: ContactRole, search?: string) {
    const tenantId = TenantContextService.getTenantId();

    const where: Prisma.ContactWhereInput = {
      tenantId,
      ...(role ? { role: { in: [role, ContactRole.BOTH] } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { tradeName: { contains: search, mode: 'insensitive' } },
              { document: { contains: search } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.prisma.client.contact.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Busca um contato pelo ID com verificação de posse do Tenant.
   */
  async findOne(id: string) {
    const tenantId = TenantContextService.getTenantId();

    const contact = await this.prisma.client.contact.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            salesOrders: true,
            purchaseOrders: true,
            financialRecords: true,
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException(`Contato com ID ${id} não encontrado.`);
    }

    return contact;
  }

  /**
   * Atualiza os dados de um contato existente.
   */
  async update(id: string, dto: UpdateContactDto) {
    await this.findOne(id); // Garante que pertence ao tenant

    const data: Prisma.ContactUpdateInput = {
      ...dto,
      creditLimit: dto.creditLimit !== undefined ? new Prisma.Decimal(dto.creditLimit) : undefined,
    };

    return this.prisma.client.contact.update({
      where: { id },
      data,
    });
  }

  /**
   * Remove ou inativa o contato dependendo de histórico operacional existente.
   */
  async remove(id: string) {
    const contact = await this.findOne(id);

    const hasRelations =
      contact._count.salesOrders > 0 ||
      contact._count.purchaseOrders > 0 ||
      contact._count.financialRecords > 0;

    if (hasRelations) {
      // Soft-delete preventivo para não quebrar integridade referencial contábil/fiscal
      return this.prisma.client.contact.update({
        where: { id },
        data: { active: false },
      });
    }

    return this.prisma.client.contact.delete({
      where: { id },
    });
  }
}
