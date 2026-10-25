const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  const tenantId = process.env.BOOTSTRAP_TENANT_ID;
  const tenantDocument = process.env.BOOTSTRAP_TENANT_DOCUMENT;
  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const adminName = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const centerName = process.env.BOOTSTRAP_CENTER_NAME?.trim() || 'Matriz';
  const companyName = process.env.BOOTSTRAP_COMPANY_NAME?.trim();
  const companyEmail = process.env.BOOTSTRAP_COMPANY_EMAIL?.trim().toLowerCase();
  const taxRegime = process.env.BOOTSTRAP_TAX_REGIME || 'SIMPLES_NACIONAL';
  if ((!tenantId && !tenantDocument) || !adminEmail || !adminName || !password || password.length < 12) {
    throw new Error('Informe BOOTSTRAP_TENANT_ID ou BOOTSTRAP_TENANT_DOCUMENT, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_NAME e BOOTSTRAP_ADMIN_PASSWORD (mínimo 12 caracteres).');
  }

  const prisma = new PrismaClient();
  try {
    let tenant = await prisma.tenant.findFirst({ where: tenantId ? { id: tenantId } : { document: tenantDocument } });
    if (!tenant && (!tenantDocument || !companyName || !companyEmail)) {
      throw new Error('Empresa não encontrada. Para criar a primeira empresa informe BOOTSTRAP_COMPANY_NAME e BOOTSTRAP_COMPANY_EMAIL.');
    }
    if (!['MEI', 'SIMPLES_NACIONAL', 'SIMPLES_NACIONAL_EXCESSO', 'LUCRO_PRESUMIDO', 'LUCRO_REAL'].includes(taxRegime)) {
      throw new Error('BOOTSTRAP_TAX_REGIME inválido.');
    }
    if (!tenant && await prisma.tenant.findFirst({ where: { document: tenantDocument } })) {
      throw new Error('Já existe uma empresa com este documento; informe o BOOTSTRAP_TENANT_ID ou mantenha o documento correto.');
    }
    const isNewTenant = !tenant;
    const existingPrimary = tenant ? await prisma.user.findFirst({ where: { tenantId: tenant.id, isPrimaryAdmin: true } }) : null;
    if (existingPrimary) throw new Error('Já existe um administrador principal. O bootstrap é de uso único.');

    const existingUser = tenant ? await prisma.user.findFirst({ where: { tenantId: tenant.id, email: adminEmail } }) : null;
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction(async (tx) => {
      if (!tenant) {
        tenant = await tx.tenant.create({
          data: {
            name: companyName,
            tradeName: process.env.BOOTSTRAP_COMPANY_TRADE_NAME?.trim() || companyName,
            document: tenantDocument,
            taxRegime,
            email: companyEmail,
            phone: process.env.BOOTSTRAP_COMPANY_PHONE || null,
          },
        });
        await tx.chartOfAccount.createMany({ data: [
          { tenantId: tenant.id, code: '1.01', name: 'Receita com Vendas de Mercadorias', type: 'REVENUE' },
          { tenantId: tenant.id, code: '1.02', name: 'Receita de Serviços Prestados', type: 'REVENUE' },
          { tenantId: tenant.id, code: '2.01', name: 'Custos com Mercadorias e Insumos', type: 'EXPENSE' },
          { tenantId: tenant.id, code: '2.02', name: 'Despesas Operacionais e Administrativas', type: 'EXPENSE' },
        ] });
      }
      const center = await tx.center.findFirst({ where: { tenantId: tenant.id, name: centerName } })
        || await tx.center.create({ data: { tenantId: tenant.id, name: centerName } });
      if (isNewTenant) {
        await tx.bankAccount.create({
          data: { tenantId: tenant.id, centerId: center.id, name: 'Caixa Geral / Principal', accountType: 'CASH_REGISTER', initialBalance: 0, currentBalance: 0 },
        });
      }
      const admin = existingUser
        ? await tx.user.update({ where: { id: existingUser.id }, data: { name: adminName, passwordHash, role: 'ADMIN', active: true, isPrimaryAdmin: true } })
        : await tx.user.create({ data: { tenantId: tenant.id, name: adminName, email: adminEmail, passwordHash, role: 'ADMIN', active: true, isPrimaryAdmin: true } });
      await tx.userCenter.upsert({
        where: { tenantId_userId_centerId: { tenantId: tenant.id, userId: admin.id, centerId: center.id } },
        create: { tenantId: tenant.id, userId: admin.id, centerId: center.id },
        update: {},
      });
      await tx.auditLog.create({ data: {
        tenantId: tenant.id, actorUserId: admin.id, centerId: center.id,
        action: 'PRIMARY_ADMIN_BOOTSTRAPPED', targetType: 'User', targetId: admin.id,
        metadata: { centerId: center.id },
      } });
    });
    process.stdout.write(`Administrador principal configurado para ${adminEmail}.\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
