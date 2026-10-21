// frontend/src/components/Layout/Sidebar.tsx
import React from 'react';
import { CafeLogo } from '../Brand/CafeLogo';
import {
  LayoutDashboard,
  ShoppingBag,
  Truck,
  Landmark,
  ArrowLeftRight,
  Package,
  Users,
  LogOut,
  Building2,
  Activity,
} from 'lucide-react';
import { erpStore } from '../../services/api';

export type ActiveTab =
  | 'overview'
  | 'sales'
  | 'purchases'
  | 'financial'
  | 'reconciliation'
  | 'products'
  | 'stock-movements'
  | 'contacts';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onLogout,
}) => {
  const tenant = erpStore.tenant;
  const user = erpStore.user;

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string; group?: string }[] = [
    { id: 'overview', label: 'Visão Geral', icon: <LayoutDashboard size={16} /> },
    { id: 'sales', label: 'Vendas & Faturamento', icon: <ShoppingBag size={16} /> },
    { id: 'purchases', label: 'Compras & NF-e', icon: <Truck size={16} /> },
    { id: 'financial', label: 'Gestão Financeira', icon: <Landmark size={16} /> },
    { id: 'reconciliation', label: 'Conciliação Bancária', icon: <ArrowLeftRight size={16} /> },
    { id: 'products', label: 'Estoque & Catálogo', icon: <Package size={16} /> },
    { id: 'stock-movements', label: 'Motor de Movimentações', icon: <Activity size={16} /> },
    { id: 'contacts', label: 'Pessoas & Contatos', icon: <Users size={16} /> },
  ];

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        height: '100vh',
        backgroundColor: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {/* 1. TOPO DA SIDEBAR: MARCA CAFE (DISCRETA E ELEGANTE) */}
      <div
        style={{
          padding: '16px 16px 12px 16px',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        <div style={{ marginBottom: '10px' }}>
          <CafeLogo size="md" />
        </div>

        {/* Empresa / Tenant Ativo */}
        <div
          style={{
            backgroundColor: 'var(--color-surface-subtle)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Building2 size={14} color="var(--color-text-secondary)" />
          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={tenant.name}
            >
              {tenant.tradeName || tenant.name}
            </div>
            <div
              style={{
                fontSize: '10px',
                color: 'var(--color-text-tertiary)',
                whiteSpace: 'nowrap',
              }}
            >
              {tenant.document}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MENU DE NAVEGAÇÃO OPERACIONAL */}
      <nav
        style={{
          flex: 1,
          padding: '12px 8px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        <div
          style={{
            fontSize: '10.5px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-text-tertiary)',
            padding: '4px 8px 8px 8px',
          }}
        >
          Módulos
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '7px 10px',
                fontSize: '12.5px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                backgroundColor: isActive ? 'var(--color-primary-50)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }
              }}
            >
              <span style={{ color: isActive ? 'var(--color-primary-600)' : 'var(--color-text-tertiary)' }}>
                {item.icon}
              </span>
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* 3. RODAPÉ DA SIDEBAR: USUÁRIO E LOGOUT */}
      <div
        style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--color-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--color-surface-subtle)',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user.name.split(' ')[0]} {user.name.split(' ').slice(-1)[0]}
          </div>
          <div
            style={{
              fontSize: '10px',
              color: 'var(--color-text-secondary)',
            }}
          >
            Perfil {user.role}
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            title="Encerrar sessão"
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px', height: 'auto', color: 'var(--color-text-tertiary)' }}
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </aside>
  );
};
