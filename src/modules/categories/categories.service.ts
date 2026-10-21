// src/modules/categories/categories.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { TenantContextService } from '../../common/multitenancy/tenant-context.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';
import { AccountCategoryType } from '../../common/enums/domain.enums';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova categoria/conta no plano de contas da empresa.
   */
  async create(dto: CreateCategoryDto) {
    const tenantId = TenantContextService.getTenantId();

    const existingCode = await this.prisma.client.chartOfAccount.findFirst({
      where: { tenantId, code: dto.code },
    });

    if (existingCode) {
      throw new ConflictException(`O código de categoria "${dto.code}" já existe nesta empresa.`);
    }

    if (dto.parentId) {
      const parent = await this.prisma.client.chartOfAccount.findFirst({
        where: { id: dto.parentId, tenantId },
      });
      if (!parent) {
        throw new NotFoundException('Categoria pai informada não foi encontrada.');
      }
    }

    return this.prisma.client.chartOfAccount.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name,
        type: dto.type,
        parentId: dto.parentId,
        active: dto.active ?? true,
      },
    });
  }

  /**
   * Retorna a lista de categorias, podendo filtrar por tipo (Receita/Despesa).
   */
  async findAll(type?: AccountCategoryType) {
    const tenantId = TenantContextService.getTenantId();

    return this.prisma.client.chartOfAccount.findMany({
      where: {
        tenantId,
        ...(type ? { type } : {}),
      },
      include: {
        parent: { select: { id: true, code: true, name: true } },
        children: { select: { id: true, code: true, name: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Busca uma categoria por ID.
   */
  async findOne(id: string) {
    const tenantId = TenantContextService.getTenantId();

    const category = await this.prisma.client.chartOfAccount.findFirst({
      where: { id, tenantId },
      include: {
        parent: true,
        children: true,
        _count: { select: { financialRecords: true } },
      },
    });

    if (!category) {
      throw new NotFoundException(`Categoria com ID ${id} não encontrada.`);
    }

    return category;
  }

  /**
   * Atualiza uma categoria existente.
   */
  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);

    if (dto.parentId === id) {
      throw new BadRequestException('Uma categoria não pode ser pai dela mesma.');
    }

    return this.prisma.client.chartOfAccount.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Remove categoria ou inativa caso possua lançamentos financeiros atrelados.
   */
  async remove(id: string) {
    const category = await this.findOne(id);

    if (category._count.financialRecords > 0 || category.children.length > 0) {
      return this.prisma.client.chartOfAccount.update({
        where: { id },
        data: { active: false },
      });
    }

    return this.prisma.client.chartOfAccount.delete({
      where: { id },
    });
  }
}
