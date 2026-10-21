// frontend/src/views/OverviewView.tsx
import React from 'react';
import {
  ShoppingBag,
  Truck,
  Landmark,
  AlertTriangle,
  ArrowRight,
  Package,
} from 'lucide-react';
import { erpStore } from '../services/api';
import { ActiveTab } from '../components/Layout/Sidebar';

interface OverviewViewProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate }) => {
  const cashFlow = erpStore.getCashFlowSummary();
  const lowStock = erpStore.products.filter((p) => p.type === 'PRODUCT' && p.currentStock <= p.minStock);
  const draftOrders = erpStore.salesOrders.filter((s) => s.status === 'DRAFT');
  const unreconciledTx = erpStore.bankTransactions.filter((t) => !t.reconciled);

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 1. ATALHOS RÁPIDOS OPERACIONAIS */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
          Atalhos de Alta Produtividade
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <button
            onClick={() => onNavigate('sales')}
            className="btn btn-secondary"
            style={{ height: '38px', justifyContent: 'flex-start', padding: '0 12px' }}
          >
            <ShoppingBag size={15} color="var(--color-primary-600)" />
            <span>Emitir Nova Venda</span>
          </button>

          <button
            onClick={() => onNavigate('purchases')}
            className="btn btn-secondary"
            style={{ height: '38px', justifyContent: 'flex-start', padding: '0 12px' }}
          >
            <Truck size={15} color="var(--color-primary-600)" />
            <span>Entrada de NF-e / Compra</span>
          </button>

          <button
            onClick={() => onNavigate('reconciliation')}
            className="btn btn-secondary"
            style={{ height: '38px', justifyContent: 'flex-start', padding: '0 12px' }}
          >
            <Landmark size={15} color="var(--color-primary-600)" />
            <span>Mesa de Conciliação ({unreconciledTx.length})</span>
          </button>

          <button
            onClick={() => onNavigate('products')}
            className="btn btn-secondary"
            style={{ height: '38px', justifyContent: 'flex-start', padding: '0 12px' }}
          >
            <Package size={15} color="var(--color-primary-600)" />
            <span>Consultar Estoque</span>
          </button>
        </div>
      </div>

      {/* 2. DADOS CONSOLIDADOS DO ERP (SOBRIEDADE SAP COM CLAREZA IFOOD) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        {/* Painel: Foco Financeiro */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Posição de Caixa Consolidada</span>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('financial')}>
              <span>Ver Financeiro</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary-600)', marginBottom: '8px' }}>
            R$ {cashFlow.summary.currentAvailableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '10px' }}>
            <div>
              <span style={{ color: 'var(--color-text-secondary)' }}>A Receber Previsto:</span>
              <div style={{ fontWeight: 600, color: 'var(--color-success-solid)' }}>
                + R$ {cashFlow.summary.totalProjectedReceivables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-secondary)' }}>A Pagar Previsto:</span>
              <div style={{ fontWeight: 600, color: 'var(--color-danger-solid)' }}>
                - R$ {cashFlow.summary.totalProjectedPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Painel: Pendências Operacionais */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
            Atenção Operacional Imediata
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lowStock.length > 0 && (
              <div
                onClick={() => onNavigate('products')}
                style={{
                  padding: '8px 10px',
                  backgroundColor: 'var(--color-warning-bg)',
                  border: '1px solid var(--color-warning-border)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={15} color="var(--color-warning-solid)" />
                  <span style={{ fontWeight: 500, color: 'var(--color-warning-text)' }}>
                    {lowStock.length} produto(s) abaixo do estoque mínimo
                  </span>
                </div>
                <ArrowRight size={13} color="var(--color-warning-solid)" />
              </div>
            )}

            {unreconciledTx.length > 0 && (
              <div
                onClick={() => onNavigate('reconciliation')}
                style={{
                  padding: '8px 10px',
                  backgroundColor: 'var(--color-info-bg)',
                  border: '1px solid var(--color-info-border)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Landmark size={15} color="var(--color-info-solid)" />
                  <span style={{ fontWeight: 500, color: 'var(--color-info-text)' }}>
                    {unreconciledTx.length} transação(ões) pendente(s) de conciliação bancária
                  </span>
                </div>
                <ArrowRight size={13} color="var(--color-info-solid)" />
              </div>
            )}

            {draftOrders.length > 0 && (
              <div
                onClick={() => onNavigate('sales')}
                style={{
                  padding: '8px 10px',
                  backgroundColor: 'var(--color-surface-subtle)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={15} color="var(--color-primary-600)" />
                  <span style={{ fontWeight: 500 }}>
                    {draftOrders.length} pedido(s) em orçamento aguardando faturamento
                  </span>
                </div>
                <ArrowRight size={13} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. TABELA DE ÚLTIMAS TRANSAÇÕES E MOVIMENTAÇÕES */}
      <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>
          Últimas Vendas Faturadas (Tempo Real)
        </h3>
        <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('sales')}>
          Ver todas as vendas &rarr;
        </button>
      </div>

      <div className="table-container">
        <table className="table-dense">
          <thead>
            <tr>
              <th style={{ width: '85px' }}>Nº Venda</th>
              <th style={{ width: '95px' }}>Data</th>
              <th>Cliente</th>
              <th>Itens</th>
              <th className="col-num" style={{ width: '120px' }}>Total Líquido</th>
              <th style={{ width: '100px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {erpStore.salesOrders.slice(0, 5).map((order) => (
              <tr key={order.id}>
                <td style={{ fontWeight: 600, color: 'var(--color-primary-600)' }}>
                  #{order.orderNumber}
                </td>
                <td style={{ color: 'var(--color-text-secondary)' }}>{order.issueDate}</td>
                <td style={{ fontWeight: 500 }}>{order.customer?.name}</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>
                  {order.items.map((i) => `${i.quantity}x ${i.product?.sku}`).join(', ')}
                </td>
                <td className="col-num" style={{ fontWeight: 600 }}>
                  R$ {order.totalNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td>
                  <span className={`status-badge ${order.status === 'INVOICED' ? 'success' : 'warning'}`}>
                    {order.status === 'INVOICED' ? 'Faturado' : 'Rascunho'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
