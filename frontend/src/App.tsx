// frontend/src/App.tsx
import React, { useState } from 'react';
import { Sidebar, ActiveTab } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { OverviewView } from './views/OverviewView';
import { SalesView } from './views/SalesView';
import { PurchasesView } from './views/PurchasesView';
import { FinancialView } from './views/FinancialView';
import { ReconciliationView } from './views/ReconciliationView';
import { ProductsView } from './views/ProductsView';
import { ContactsView } from './views/ContactsView';
import { LoginView } from './views/LoginView';
import { StockMovementsView } from './views/StockMovementsView';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: 'var(--color-canvas)',
      }}
    >
      {/* Sidebar Compacta com a Marca CAFE no Topo */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={() => setIsAuthenticated(false)}
      />

      {/* Área de Conteúdo Principal */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Cabeçalho Discreto */}
        <Header activeTab={activeTab} />

        {/* Módulo Ativo */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: 'var(--color-canvas)',
          }}
        >
          {activeTab === 'overview' && <OverviewView onNavigate={setActiveTab} />}
          {activeTab === 'sales' && <SalesView />}
          {activeTab === 'purchases' && <PurchasesView />}
          {activeTab === 'financial' && <FinancialView />}
          {activeTab === 'reconciliation' && <ReconciliationView />}
          {activeTab === 'products' && <ProductsView />}
          {activeTab === 'stock-movements' && <StockMovementsView />}
          {activeTab === 'contacts' && <ContactsView />}
        </main>
      </div>
    </div>
  );
}

export default App;
