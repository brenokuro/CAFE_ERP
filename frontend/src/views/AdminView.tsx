import { FormEvent, useCallback, useEffect, useState } from 'react';
import { apiFetch, Center } from '../services/auth';

type ManagedUser = {
  id: string; name: string; email: string; role: string; active: boolean; isPrimaryAdmin: boolean; centers: Center[];
};
type LegacyRow = { id: string; label: string };
type AuditEntry = { id: string; action: string; targetType: string; targetId: string | null; createdAt: string; actor?: { name: string; email: string }; center?: { name: string } | null };
type LegacyRecords = Partial<Record<'salesOrders' | 'purchaseOrders' | 'stockMovements' | 'financialRecords' | 'bankAccounts' | 'bankTransactions' | 'batches' | 'stockBalances', LegacyRow[]>>;
const roles = ['ADMIN', 'MANAGER', 'SALES', 'PURCHASING', 'FINANCIAL', 'STOCK', 'OPERATOR'];

export function AdminView({ onCentersChanged }: { onCentersChanged?: (centers: Center[]) => void }) {
  const [centers, setCenters] = useState<Center[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [legacyRows, setLegacyRows] = useState<{ entity: string; title: string; rows: LegacyRow[] }[]>([]);
  const [centerName, setCenterName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('OPERATOR');
  const [centerIds, setCenterIds] = useState<string[]>([]);
  const [legacyCenterId, setLegacyCenterId] = useState('');
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    const [centerRows, userRows, legacy, auditRows] = await Promise.all([
      apiFetch<Center[]>('/admin/centers'), apiFetch<ManagedUser[]>('/admin/users'),
      apiFetch<LegacyRecords>('/admin/unassigned-records'), apiFetch<AuditEntry[]>('/admin/audit-logs'),
    ]);
    setCenters(centerRows); setUsers(userRows);
    setAuditEntries(auditRows);
    onCentersChanged?.(centerRows.filter((center) => center.active));
    const labels: Record<string, string> = {
      salesOrders: 'Venda', purchaseOrders: 'Compra', stockMovements: 'Movimentação de estoque',
      financialRecords: 'Título financeiro', bankAccounts: 'Conta bancária', bankTransactions: 'Transação bancária',
      batches: 'Lote', stockBalances: 'Saldo de estoque',
    };
    const entityNames: Record<string, string> = {
      salesOrders: 'salesOrder', purchaseOrders: 'purchaseOrder', stockMovements: 'stockMovement',
      financialRecords: 'financialRecord', bankAccounts: 'bankAccount', bankTransactions: 'bankTransaction',
      batches: 'batch', stockBalances: 'productStock',
    };
    const rows = Object.entries(legacy).map(([key, values]) => ({
      entity: entityNames[key], title: labels[key] || key,
      rows: (values || []).map((item: any) => ({
        id: item.id,
        label: item.name || item.description || item.batchCode || item.sku || `${item.orderNumber ? `#${item.orderNumber}` : ''} ${item.productId || ''} ${item.unassignedQuantity || ''}`.trim() || item.id,
      })),
    })).filter((group) => group.rows.length > 0);
    setLegacyRows(rows);
  }, [onCentersChanged]);
  // Sincroniza o painel com os endpoints administrativos ao abrir a tela.
  // eslint-disable-next-line react/set-state-in-effect
  useEffect(() => { refresh().catch((error) => setMessage(error.message)); }, [refresh]);

  async function createCenter(event: FormEvent) {
    event.preventDefault();
    try { await apiFetch('/admin/centers', { method: 'POST', body: JSON.stringify({ name: centerName }) }); setCenterName(''); setMessage('Centro criado.'); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Falha ao criar centro.'); }
  }
  async function toggleCenter(center: Center) {
    try { await apiFetch(`/admin/centers/${center.id}`, { method: 'PATCH', body: JSON.stringify({ active: !center.active }) }); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Falha ao atualizar centro.'); }
  }
  async function createUser(event: FormEvent) {
    event.preventDefault();
    try {
      await apiFetch('/admin/users', { method: 'POST', body: JSON.stringify({ name, email, password, role, centerIds }) });
      setName(''); setEmail(''); setPassword(''); setCenterIds([]); setMessage('Usuário criado.'); await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Falha ao criar usuário.'); }
  }
  async function saveAccess(user: ManagedUser, nextRole: string, nextCenterIds: string[]) {
    try {
      await apiFetch(`/admin/users/${user.id}/access`, { method: 'PATCH', body: JSON.stringify({ role: nextRole, centerIds: nextCenterIds }) });
      setMessage(`Acesso atualizado para ${user.email}.`); await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Falha ao atualizar permissões.'); }
  }
  async function toggleUser(user: ManagedUser) {
    try { await apiFetch(`/admin/users/${user.id}/status`, { method: 'PATCH', body: JSON.stringify({ active: !user.active }) }); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Falha ao atualizar usuário.'); }
  }
  async function assignLegacy(entity: string, row: LegacyRow) {
    try {
      await apiFetch(`/admin/unassigned-records/${entity}/${row.id}/assign`, {
        method: 'POST', body: JSON.stringify({ centerId: effectiveLegacyCenterId }),
      });
      setMessage(`${row.label} associado ao centro selecionado.`); await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Falha ao associar registro legado.'); }
  }
  const toggleId = (id: string, selected: string[], setter: (next: string[]) => void) =>
    setter(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  const activeUsers = users.filter((user) => user.active).length;
  const activeCenters = centers.filter((center) => center.active).length;
  const pendingLegacy = legacyRows.reduce((total, group) => total + group.rows.length, 0);
  const effectiveLegacyCenterId = legacyCenterId || centers.find((center) => center.active)?.id || '';

  return <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
      <div>
        <p style={{ color: 'var(--color-primary-600)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Painel do administrador principal</p>
        <h2 style={{ fontSize: 24, margin: '4px 0' }}>Gerenciamento do CAFE ERP</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>Acessos, centros, histórico legado e auditoria em um só lugar.</p>
      </div>
      <button className="btn btn-secondary" onClick={() => refresh().catch((error) => setMessage(error.message))}>Atualizar painel</button>
    </div>
    {message && <p role="status">{message}</p>}
    <section aria-label="Resumo administrativo" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 20 }}>
      <SummaryCard title="Usuários ativos" value={`${activeUsers}/${users.length}`} detail="Contas da empresa" />
      <SummaryCard title="Centros ativos" value={`${activeCenters}/${centers.length}`} detail="Lojas disponíveis" />
      <SummaryCard title="Itens históricos pendentes" value={String(pendingLegacy)} detail="Aguardam associação explícita" />
      <SummaryCard title="Eventos de auditoria" value={String(auditEntries.length)} detail="Atividade administrativa recente" />
    </section>
    <section className="card" style={{ padding: 20, marginBottom: 20 }}>
      <h3>Centros e lojas</h3>
      <form onSubmit={createCenter} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input required value={centerName} onChange={(event) => setCenterName(event.target.value)} placeholder="Nome do centro" />
        <button className="btn btn-primary">Adicionar centro</button>
      </form>
      {centers.map((center) => <div key={center.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--color-border-subtle)' }}>
        <span>{center.name} · {center.active ? 'Ativo' : 'Inativo'}</span>
        <button className="btn btn-ghost btn-sm" onClick={() => toggleCenter(center)}>{center.active ? 'Desativar' : 'Ativar'}</button>
      </div>)}
    </section>
    <section className="card" style={{ padding: 20, marginBottom: 20 }}>
      <h3>Criar usuário</h3>
      <form onSubmit={createUser} style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}>
        <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome" />
        <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-mail" />
        <input required minLength={12} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha (mínimo 12 caracteres)" />
        <select value={role} onChange={(event) => setRole(event.target.value)}>{roles.map((item) => <option key={item}>{item}</option>)}</select>
        <fieldset style={{ gridColumn: '1 / -1' }}><legend>Centros autorizados</legend>
          {centers.filter((center) => center.active).map((center) => <label key={center.id} style={{ marginRight: 14 }}>
            <input type="checkbox" checked={centerIds.includes(center.id)} onChange={() => toggleId(center.id, centerIds, setCenterIds)} /> {center.name}
          </label>)}
        </fieldset>
        <button className="btn btn-primary" style={{ justifySelf: 'start' }}>Criar usuário</button>
      </form>
    </section>
    <section className="card" style={{ padding: 20 }}>
      <h3>Usuários</h3>
      {users.map((user) => <UserRow key={`${user.id}:${user.role}:${user.active}:${user.centers.map((center) => center.id).sort().join(',')}`} user={user} centers={centers.filter((center) => center.active)} onSave={saveAccess} onToggle={toggleUser} />)}
    </section>
    <section className="card" style={{ padding: 20, marginTop: 20 }}>
      <h3>Histórico sem centro</h3>
      <p>Registros antigos permanecem sem centro até você escolher explicitamente onde pertencem.</p>
      <select aria-label="Centro para associar histórico" value={effectiveLegacyCenterId} onChange={(event) => setLegacyCenterId(event.target.value)}>
        {centers.filter((center) => center.active).map((center) => <option key={center.id} value={center.id}>{center.name}</option>)}
      </select>
      {legacyRows.length === 0 && <p>Nenhum registro pendente de associação.</p>}
      {legacyRows.map((group) => <div key={group.entity} style={{ marginTop: 12 }}>
        <strong>{group.title}</strong>
        {group.rows.map((row) => <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
          <span>{row.label}</span>
          <button className="btn btn-secondary btn-sm" disabled={!effectiveLegacyCenterId} onClick={() => assignLegacy(group.entity, row)}>Associar</button>
        </div>)}
      </div>)}
    </section>
    <section className="card" style={{ padding: 20, marginTop: 20 }}>
      <h3>Atividade administrativa recente</h3>
      {auditEntries.length === 0 ? <p style={{ color: 'var(--color-text-secondary)' }}>Ainda não há eventos registrados.</p> : <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead><tr>{['Ação', 'Responsável', 'Centro', 'Data'].map((label) => <th key={label} style={{ padding: '10px 8px', borderBottom: '1px solid var(--color-border-subtle)' }}>{label}</th>)}</tr></thead>
          <tbody>{auditEntries.slice(0, 12).map((entry) => <tr key={entry.id}>
            <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--color-border-subtle)' }}><strong>{entry.action}</strong><div style={{ color: 'var(--color-text-secondary)' }}>{entry.targetType}{entry.targetId ? ` · ${entry.targetId.slice(0, 8)}` : ''}</div></td>
            <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--color-border-subtle)' }}>{entry.actor?.name || entry.actor?.email || 'Sistema'}</td>
            <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--color-border-subtle)' }}>{entry.center?.name || '—'}</td>
            <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--color-border-subtle)', whiteSpace: 'nowrap' }}>{new Date(entry.createdAt).toLocaleString('pt-BR')}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    </section>
  </div>;
}

function SummaryCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return <article className="card" style={{ padding: 18, borderTop: '3px solid var(--color-primary-600)' }}>
    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{title}</p>
    <p style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.1 }}>{value}</p>
    <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 8 }}>{detail}</p>
  </article>;
}

function UserRow({ user, centers, onSave, onToggle }: {
  user: ManagedUser; centers: Center[];
  onSave: (user: ManagedUser, role: string, centerIds: string[]) => void;
  onToggle: (user: ManagedUser) => void;
}) {
  const [role, setRole] = useState(user.role);
  const [centerIds, setCenterIds] = useState(user.centers.map((center) => center.id));
  return <div style={{ borderTop: '1px solid var(--color-border-subtle)', padding: '12px 0', display: 'grid', gap: 8 }}>
    <strong>{user.name} · {user.email} {user.isPrimaryAdmin ? '(principal)' : ''}</strong>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <select value={role} disabled={user.isPrimaryAdmin} onChange={(event) => setRole(event.target.value)}>{roles.map((item) => <option key={item}>{item}</option>)}</select>
      {centers.map((center) => <label key={center.id}><input type="checkbox" disabled={user.isPrimaryAdmin} checked={centerIds.includes(center.id)} onChange={() => setCenterIds((prev) => prev.includes(center.id) ? prev.filter((id) => id !== center.id) : [...prev, center.id])} /> {center.name}</label>)}
      {!user.isPrimaryAdmin && <>
        <button className="btn btn-secondary btn-sm" onClick={() => onSave(user, role, centerIds)}>Salvar permissões</button>
        <button className="btn btn-ghost btn-sm" onClick={() => onToggle(user)}>{user.active ? 'Desativar' : 'Ativar'}</button>
      </>}
      <span>{user.active ? 'Ativo' : 'Inativo'}</span>
    </div>
  </div>;
}
