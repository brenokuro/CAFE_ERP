import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { TenantContextService } from '../../common/multitenancy/tenant-context.service';
import { AssignLegacyRecordDto, CreateCenterDto, CreateManagedUserDto, UpdateCenterDto, UpdateUserAccessDto, UpdateUserStatusDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private get tenantId() { return TenantContextService.getTenantId(); }
  private get actorUserId() { return TenantContextService.getUserId()!; }

  private async validateCenters(centerIds: string[]) {
    const uniqueIds = [...new Set(centerIds)];
    const found = await this.prisma.center.findMany({
      where: { tenantId: this.tenantId, id: { in: uniqueIds }, active: true },
      select: { id: true },
    });
    if (found.length !== uniqueIds.length) throw new BadRequestException('Um ou mais centros são inválidos ou estão inativos.');
    return uniqueIds;
  }

  private audit(action: string, targetType: string, targetId: string | null, metadata?: object, centerId?: string) {
    return this.prisma.auditLog.create({
      data: { tenantId: this.tenantId, actorUserId: this.actorUserId, centerId, action, targetType, targetId, metadata },
    });
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({
      where: { tenantId: this.tenantId },
      select: {
        id: true, name: true, email: true, role: true, active: true, isPrimaryAdmin: true,
        createdAt: true,
        userCenters: { include: { center: { select: { id: true, name: true, active: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return users.map((user) => ({ ...user, centers: user.userCenters.map((membership) => membership.center), userCenters: undefined }));
  }

  async createUser(dto: CreateManagedUserDto) {
    const email = dto.email.trim().toLowerCase();
    const duplicate = await this.prisma.user.findFirst({ where: { tenantId: this.tenantId, email } });
    if (duplicate) throw new ConflictException('Já existe um usuário com este e-mail nesta empresa.');
    const centerIds = await this.validateCenters(dto.centerIds);
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          tenantId: this.tenantId, name: dto.name.trim(), email, passwordHash, role: dto.role,
          userCenters: { create: centerIds.map((centerId) => ({ tenantId: this.tenantId, centerId })) },
        },
        select: { id: true, name: true, email: true, role: true, active: true, isPrimaryAdmin: true },
      });
      await tx.auditLog.create({ data: {
        tenantId: this.tenantId, actorUserId: this.actorUserId, action: 'USER_CREATED',
        targetType: 'User', targetId: created.id, metadata: { role: created.role, centerIds },
      } });
      return created;
    });
    return user;
  }

  async setUserStatus(userId: string, dto: UpdateUserStatusDto) {
    const target = await this.prisma.user.findFirst({ where: { id: userId, tenantId: this.tenantId } });
    if (!target) throw new NotFoundException('Usuário não encontrado.');
    if (target.isPrimaryAdmin) throw new BadRequestException('O administrador principal não pode ser desativado.');
    if (target.id === this.actorUserId) throw new BadRequestException('O administrador principal não pode alterar o próprio acesso por esta operação.');
    const updated = await this.prisma.user.update({ where: { id: target.id }, data: { active: dto.active }, select: { id: true, email: true, active: true, role: true } });
    await this.audit(dto.active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED', 'User', target.id, { active: dto.active });
    return updated;
  }

  async updateUserAccess(userId: string, dto: UpdateUserAccessDto) {
    const target = await this.prisma.user.findFirst({ where: { id: userId, tenantId: this.tenantId } });
    if (!target) throw new NotFoundException('Usuário não encontrado.');
    if (target.isPrimaryAdmin) throw new BadRequestException('As permissões do administrador principal são imutáveis.');
    const centerIds = await this.validateCenters(dto.centerIds);
    const oldCenters = await this.prisma.userCenter.findMany({ where: { tenantId: this.tenantId, userId }, select: { centerId: true } });
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { role: dto.role } });
      await tx.userCenter.deleteMany({ where: { tenantId: this.tenantId, userId } });
      if (centerIds.length) await tx.userCenter.createMany({ data: centerIds.map((centerId) => ({ tenantId: this.tenantId, userId, centerId })) });
      await tx.auditLog.create({ data: {
        tenantId: this.tenantId, actorUserId: this.actorUserId, action: 'USER_ACCESS_UPDATED',
        targetType: 'User', targetId: userId,
        metadata: { previousRole: target.role, role: dto.role, previousCenterIds: oldCenters.map((entry) => entry.centerId), centerIds },
      } });
    });
    return { id: userId, role: dto.role, centerIds };
  }

  async listCenters(includeInactive = false) {
    return this.prisma.center.findMany({
      where: { tenantId: this.tenantId, ...(includeInactive ? {} : { active: true }) },
      orderBy: { name: 'asc' },
    });
  }

  async listMyCenters(user: { sub: string; tenantId: string; isPrimaryAdmin?: boolean }) {
    if (user.isPrimaryAdmin) return this.listCenters();
    const memberships = await this.prisma.userCenter.findMany({
      where: { tenantId: user.tenantId, userId: user.sub, center: { active: true } },
      include: { center: true }, orderBy: { center: { name: 'asc' } },
    });
    return memberships.map(({ center }) => center);
  }

  async listMyCentersFromContext() {
    return this.listMyCenters({
      sub: TenantContextService.getUserId()!,
      tenantId: this.tenantId,
      isPrimaryAdmin: TenantContextService.getSession()?.isPrimaryAdmin,
    });
  }

  async createCenter(dto: CreateCenterDto) {
    const center = await this.prisma.center.create({ data: { tenantId: this.tenantId, name: dto.name.trim() } });
    await this.audit('CENTER_CREATED', 'Center', center.id, { name: center.name });
    return center;
  }

  async updateCenter(centerId: string, dto: UpdateCenterDto) {
    const center = await this.prisma.center.findFirst({ where: { id: centerId, tenantId: this.tenantId } });
    if (!center) throw new NotFoundException('Centro não encontrado.');
    const updated = await this.prisma.center.update({ where: { id: centerId }, data: dto });
    await this.audit(dto.active === undefined ? 'CENTER_UPDATED' : dto.active ? 'CENTER_ACTIVATED' : 'CENTER_DEACTIVATED', 'Center', centerId, dto, centerId);
    return updated;
  }

  async listAuditLogs() {
    return this.prisma.auditLog.findMany({
      where: { tenantId: this.tenantId },
      include: { actor: { select: { id: true, name: true, email: true } }, center: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' }, take: 200,
    });
  }

  async listUnassigned() {
    const tenantId = this.tenantId;
    const [salesOrders, purchaseOrders, stockMovements, financialRecords, bankAccounts, bankTransactions, batches, products] = await Promise.all([
      this.prisma.salesOrder.findMany({ where: { tenantId, centerId: null }, select: { id: true, orderNumber: true, createdAt: true } }),
      this.prisma.purchaseOrder.findMany({ where: { tenantId, centerId: null }, select: { id: true, orderNumber: true, createdAt: true } }),
      this.prisma.stockMovement.findMany({ where: { tenantId, centerId: null }, select: { id: true, productId: true, quantity: true, createdAt: true } }),
      this.prisma.financialRecord.findMany({ where: { tenantId, centerId: null }, select: { id: true, description: true, dueDate: true } }),
      this.prisma.bankAccount.findMany({ where: { tenantId, centerId: null }, select: { id: true, name: true } }),
      this.prisma.bankTransaction.findMany({ where: { tenantId, centerId: null }, select: { id: true, description: true, transactionDate: true } }),
      this.prisma.productBatch.findMany({ where: { tenantId, centerId: null }, select: { id: true, productId: true, batchCode: true } }),
      this.prisma.product.findMany({ where: { tenantId, stockQuantity: { gt: 0 } }, select: { id: true, sku: true, name: true, stockQuantity: true, centerStocks: { select: { quantity: true } } } }),
    ]);
    const unassignedStock = products.filter((product) => product.stockQuantity.greaterThan(
      product.centerStocks.reduce((sum, row) => sum.add(row.quantity), new Prisma.Decimal(0)),
    )).map(({ centerStocks, ...product }) => ({
      ...product,
      unassignedQuantity: product.stockQuantity.sub(centerStocks.reduce((sum, row) => sum.add(row.quantity), new Prisma.Decimal(0))),
    }));
    return { salesOrders, purchaseOrders, stockMovements, financialRecords, bankAccounts, bankTransactions, batches, stockBalances: unassignedStock };
  }

  async assignLegacy(entity: string, id: string, dto: AssignLegacyRecordDto) {
    const center = await this.prisma.center.findFirst({ where: { id: dto.centerId, tenantId: this.tenantId, active: true } });
    if (!center) throw new NotFoundException('Centro inexistente ou inativo.');
    // Registros vinculados precisam permanecer no mesmo centro; isso evita que a
    // associação de um registro legado crie relações visíveis entre centros.
    const conflicting = async (model: 'salesOrder' | 'purchaseOrder' | 'stockMovement' | 'financialRecord' | 'bankAccount' | 'bankTransaction') => {
      const where = { id, tenantId: this.tenantId };
      if (model === 'salesOrder') {
        const row = await this.prisma.salesOrder.findFirst({ where, select: { stockMovements: { where: { centerId: { not: null } }, select: { centerId: true } }, financialRecords: { where: { centerId: { not: null } }, select: { centerId: true } } } });
        return row && [...row.stockMovements, ...row.financialRecords].some((item) => item.centerId !== center.id);
      }
      if (model === 'purchaseOrder') {
        const row = await this.prisma.purchaseOrder.findFirst({ where, select: { stockMovements: { where: { centerId: { not: null } }, select: { centerId: true } }, financialRecords: { where: { centerId: { not: null } }, select: { centerId: true } } } });
        return row && [...row.stockMovements, ...row.financialRecords].some((item) => item.centerId !== center.id);
      }
      if (model === 'stockMovement') {
        const row = await this.prisma.stockMovement.findFirst({ where, select: { salesOrder: { select: { centerId: true } }, purchaseOrder: { select: { centerId: true } } } });
        return row && [row.salesOrder?.centerId, row.purchaseOrder?.centerId].some((centerId) => centerId != null && centerId !== center.id);
      }
      if (model === 'financialRecord') {
        const row = await this.prisma.financialRecord.findFirst({ where, select: { salesOrder: { select: { centerId: true } }, purchaseOrder: { select: { centerId: true } } } });
        return row && [row.salesOrder?.centerId, row.purchaseOrder?.centerId].some((centerId) => centerId != null && centerId !== center.id);
      }
      if (model === 'bankAccount') {
        const row = await this.prisma.bankAccount.findFirst({ where, select: { transactions: { where: { centerId: { not: null } }, select: { centerId: true } } } });
        return row && row.transactions.some((item) => item.centerId !== center.id);
      }
      const row = await this.prisma.bankTransaction.findFirst({ where, select: { bankAccount: { select: { centerId: true } }, financialRecord: { select: { centerId: true } } } });
      return row && [row.bankAccount.centerId, row.financialRecord?.centerId].some((centerId) => centerId != null && centerId !== center.id);
    };
    const relationModel: Record<string, Parameters<typeof conflicting>[0]> = {
      salesOrder: 'salesOrder', purchaseOrder: 'purchaseOrder', stockMovement: 'stockMovement',
      financialRecord: 'financialRecord', bankAccount: 'bankAccount', bankTransaction: 'bankTransaction',
    };
    const model = relationModel[entity];
    if (model && await conflicting(model)) throw new ConflictException('O registro possui vínculos atribuídos a outro centro. Associe os registros relacionados ao mesmo centro.');
    const updates: Record<string, () => Promise<unknown>> = {
      salesOrder: () => this.prisma.$transaction(async (tx) => {
        const order = await tx.salesOrder.updateMany({ where: { id, tenantId: this.tenantId, centerId: null }, data: { centerId: center.id } });
        if (!order.count) throw new NotFoundException('Venda antiga não encontrada ou já atribuída.');
        await tx.stockMovement.updateMany({ where: { tenantId: this.tenantId, salesOrderId: id, centerId: null }, data: { centerId: center.id } });
        await tx.financialRecord.updateMany({ where: { tenantId: this.tenantId, salesOrderId: id, centerId: null }, data: { centerId: center.id } });
        return order;
      }),
      purchaseOrder: () => this.prisma.$transaction(async (tx) => {
        const order = await tx.purchaseOrder.updateMany({ where: { id, tenantId: this.tenantId, centerId: null }, data: { centerId: center.id } });
        if (!order.count) throw new NotFoundException('Compra antiga não encontrada ou já atribuída.');
        await tx.stockMovement.updateMany({ where: { tenantId: this.tenantId, purchaseOrderId: id, centerId: null }, data: { centerId: center.id } });
        await tx.financialRecord.updateMany({ where: { tenantId: this.tenantId, purchaseOrderId: id, centerId: null }, data: { centerId: center.id } });
        return order;
      }),
      stockMovement: () => this.prisma.stockMovement.updateMany({ where: { id, tenantId: this.tenantId, centerId: null }, data: { centerId: center.id } }),
      financialRecord: () => this.prisma.financialRecord.updateMany({ where: { id, tenantId: this.tenantId, centerId: null }, data: { centerId: center.id } }),
      bankAccount: () => this.prisma.bankAccount.updateMany({ where: { id, tenantId: this.tenantId, centerId: null }, data: { centerId: center.id } }),
      bankTransaction: () => this.prisma.bankTransaction.updateMany({ where: { id, tenantId: this.tenantId, centerId: null }, data: { centerId: center.id } }),
      batch: () => this.prisma.productBatch.updateMany({ where: { id, tenantId: this.tenantId, centerId: null }, data: { centerId: center.id } }),
      productStock: () => this.assignLegacyStock(id, center.id),
    };
    const assign = updates[entity];
    if (!assign) throw new BadRequestException('Tipo de registro legado inválido.');
    const result: any = await assign();
    if (typeof result?.count === 'number' && result.count === 0) throw new NotFoundException('Registro legado não encontrado ou já atribuído.');
    await this.audit('LEGACY_RECORD_ASSIGNED', entity, id, { centerId: center.id }, center.id);
    return { id, entity, centerId: center.id };
  }

  private async assignLegacyStock(productId: string, centerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({ where: { id: productId, tenantId: this.tenantId }, include: { centerStocks: true } });
      if (!product) throw new NotFoundException('Produto não encontrado.');
      const assigned = product.centerStocks.reduce((sum, row) => sum.add(row.quantity), new Prisma.Decimal(0));
      const remaining = product.stockQuantity.sub(assigned);
      if (remaining.lessThanOrEqualTo(0)) throw new BadRequestException('O estoque legado deste produto já foi associado a centros.');
      const existing = product.centerStocks.find((stock) => stock.centerId === centerId);
      await tx.centerStock.upsert({
        where: { tenantId_centerId_productId: { tenantId: this.tenantId, centerId, productId } },
        create: { tenantId: this.tenantId, centerId, productId, quantity: remaining },
        update: { quantity: { increment: remaining } },
      });
      await tx.auditLog.create({ data: {
        tenantId: this.tenantId, actorUserId: this.actorUserId, centerId,
        action: 'LEGACY_STOCK_ASSIGNED', targetType: 'Product', targetId: productId,
        metadata: { assignedQuantity: remaining.toString(), previousCenterQuantity: existing?.quantity.toString() ?? '0' },
      } });
      return { productId, centerId, assignedQuantity: remaining };
    });
  }
}
