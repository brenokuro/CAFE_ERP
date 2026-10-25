// frontend/src/components/Layout/Header.tsx
import React from 'react';
import { Search, Bell, AlertTriangle } from 'lucide-react';
import { ActiveTab } from './Sidebar';
import { erpStore } from '../../services/api';
import { Center } from '../../services/auth';

interface HeaderProps {
  activeTab: ActiveTab;
  onSearchChange?: (term: string) => void;
  centers: Center[];
  selectedCenterId: string;
  onCenterChange: (centerId: string) => void;
}

const TAB_TITLES: Record<ActiveTab, { title: string; subtitle: string }> = {
  overview: { title: 'Visão Geral', subtitle: 'Métricas executivas e indicadores em tempo real' },
  sales: { title: 'Vendas & Faturamento', subtitle: 'Gestão de orçamentos, pedidos e emissão com baixa de estoque' },
  purchases: { title: 'Compras & Entrada NF-e', subtitle: 'Pedidos de compra, chave de acesso e recálculo de custo médio' },
  financial: { title: 'Gestão Financeira & Caixa', subtitle: 'Contas a Pagar, Contas a Receber e fluxo de caixa projetado' },
  reconciliation: { title: 'Conciliação Bancária', subtitle: 'Conexão entre extrato bancário (PIX/OFX) e títulos operacionais' },
  products: { title: 'Estoque & Catálogo', subtitle: 'Cadastro de produtos, serviços, saldo e histórico auditável' },
  'stock-movements': { title: 'Motor de Movimentações de Estoque', subtitle: 'Histórico auditável com códigos SAP (101, 201, 501…), rastreabilidade por lote e FIFO/FEFO' },
  contacts: { title: 'Pessoas & Contatos', subtitle: 'Base unificada de clientes, fornecedores e limites de crédito' },
  admin: { title: 'Usuários & Centros', subtitle: 'Administração de acessos, lojas e auditoria' },
};

export const Header: React.FC<HeaderProps> = ({ activeTab, onSearchChange, centers, selectedCenterId, onCenterChange }) => {
  const current = TAB_TITLES[activeTab] || { title: 'CAFE ERP', subtitle: '' };

  // Verifica alertas operacionais rápidos
  const lowStockProducts = erpStore.products.filter((p) => p.currentStock <= p.minStock && p.type === 'PRODUCT');
  const pendingReceivablesCount = erpStore.financialRecords.filter((r) => r.type === 'RECEIVABLE' && r.status === 'PENDING').length;

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
        zIndex: 'var(--z-header)',
      }}
    >
      {/* 1. TÍTULO E BREADCRUMB DISCRETO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--color-text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          CAFE
        </span>
        <span style={{ color: 'var(--color-border-default)', fontSize: '12px' }}>/</span>
        <h1
          style={{
            fontSize: '13.5px',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            margin: 0,
          }}
        >
          {current.title}
        </h1>
      </div>

      {/* 2. BARRA DE BUSCA GLOBAL RÁPIDA & CONTROLES DISCRETOS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
          Centro
          <select
            aria-label="Centro ou loja selecionada"
            value={selectedCenterId}
            onChange={(event) => onCenterChange(event.target.value)}
            disabled={centers.length === 0}
            style={{ height: '30px', minWidth: '140px', fontSize: '12px' }}
          >
            {centers.length === 0 && <option value="">Sem centros autorizados</option>}
            {centers.map((center) => <option key={center.id} value={center.id}>{center.name}</option>)}
          </select>
        </label>
        {/* Campo de Busca Rápida */}
        <div style={{ position: 'relative', width: '260px' }}>
          <Search
            size={14}
            color="var(--color-text-tertiary)"
            style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <input
            type="text"
            placeholder="Buscar vendas, clientes, SKU..."
            onChange={(e) => onSearchChange?.(e.target.value)}
            style={{
              width: '100%',
              height: '28px',
              paddingLeft: '28px',
              paddingRight: '36px',
              fontSize: '12px',
              backgroundColor: 'var(--color-canvas)',
              borderColor: 'var(--color-border-subtle)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              right: '6px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--color-text-tertiary)',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: '2px',
              padding: '1px 3px',
              lineHeight: 1,
            }}
          >
            ⌘K
          </span>
        </div>

        {/* Indicador de Status do Sistema */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            backgroundColor: 'var(--color-surface-subtle)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px 8px',
          }}
        >
          <span className="status-dot success" />
          <span>Produção Online</span>
        </div>

        {/* Notificações Operacionais (Estoque Baixo / Títulos) */}
        <div
          title={`${lowStockProducts.length} itens com estoque baixo | ${pendingReceivablesCount} títulos a receber`}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            backgroundColor: lowStockProducts.length > 0 ? 'var(--color-warning-bg)' : 'transparent',
            border: lowStockProducts.length > 0 ? '1px solid var(--color-warning-border)' : '1px solid transparent',
          }}
        >
          {lowStockProducts.length > 0 ? (
            <AlertTriangle size={15} color="var(--color-warning-solid)" />
          ) : (
            <Bell size={15} color="var(--color-text-secondary)" />
          )}
          {lowStockProducts.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-danger-solid)',
              }}
            />
          )}
        </div>
      </div>
    </header>
  );
};
