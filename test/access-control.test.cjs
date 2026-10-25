const test = require('node:test');
const assert = require('node:assert/strict');
const { CenterAccessGuard, PrincipalAdminGuard, RolesGuard } = require('../dist/common/guards/access-control');
const { TenantContextService } = require('../dist/common/multitenancy/tenant-context.service');

const tenantId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const centerA = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const centerB = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const userId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

function executionContext(request) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
  };
}

function fakePrisma(memberships = [{ centerId: centerA }]) {
  return {
    center: { findFirst: async ({ where }) => where.id === centerA || where.id === centerB ? { id: where.id } : null },
    userCenter: { findFirst: async ({ where }) => memberships.find((item) => item.centerId === where.centerId) || null },
  };
}

function runCenterGuard(request, memberships) {
  const guard = new CenterAccessGuard(fakePrisma(memberships));
  return TenantContextService.runWithContext(
    { tenantId, userId, userRole: 'OPERATOR' },
    () => guard.canActivate(executionContext(request)),
  );
}

test('a user can enter an active center assigned to their account', async () => {
  const request = { user: { sub: userId, tenantId, role: 'OPERATOR' }, headers: { 'x-center-id': centerA }, body: {} };
  assert.equal(await runCenterGuard(request), true);
  assert.equal(request.centerId, centerA);
});

test('a user cannot select a center assigned to another account', async () => {
  const request = { user: { sub: userId, tenantId, role: 'OPERATOR' }, headers: { 'x-center-id': centerB }, body: {} };
  await assert.rejects(runCenterGuard(request), /não tem acesso a este centro/);
});

test('a protected operation fails if no center was selected', async () => {
  const request = { user: { sub: userId, tenantId, role: 'OPERATOR' }, headers: {}, body: {} };
  await assert.rejects(runCenterGuard(request), /Selecione um centro autorizado/);
});

test('ordinary users cannot pass the principal administrator guard', () => {
  const guard = new PrincipalAdminGuard();
  assert.throws(() => guard.canActivate(executionContext({ user: { isPrimaryAdmin: false } })), /administrador principal/);
  assert.equal(guard.canActivate(executionContext({ user: { isPrimaryAdmin: true } })), true);
});

test('role guard denies access when a route has no explicit role policy', () => {
  const guard = new RolesGuard({ getAllAndOverride: () => undefined });
  assert.throws(
    () => guard.canActivate(executionContext({ user: { role: 'OPERATOR' } })),
    /não permite esta operação/,
  );
});
