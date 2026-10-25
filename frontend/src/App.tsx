// frontend/src/App.tsx
import React, { useEffect, useState } from 'react';
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
import { AdminView } from './views/AdminView';
import { apiFetch, Center, getSelectedCenterId, getStoredSession, hasSession, logout, selectCenter } from './services/auth';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => hasSession() && Boolean(getStoredSession()));
  const [session, setSession] = useState(getStoredSession);
  const [centers, setCenters] = useState<Center[]>([]);
  const [selectedCenterId, setSelectedCenterId] = useState(getSelectedCenterId);
  const [centerError, setCenterError] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => getStoredSession()?.user.isPrimaryAdmin ? 'admin' : 'overview');
  const [profileLoading, setProfileLoading] = useState(() => hasSession() && Boolean(getStoredSession()));
  const [profileError, setProfileError] = useState('');
  const [profileAttempt, setProfileAttempt] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    setProfileLoading(true);
    setProfileError('');
    apiFetch<{ user: NonNullable<typeof session>['user']; tenant: NonNullable<typeof session>['tenant']; centers: Center[] }>('/auth/me', {}, '')
      .then((profile) => {
        setSession({ user: profile.user, tenant: profile.tenant });
        setCenters(profile.centers);
        setActiveTab((current) => {
          if (profile.user.isPrimaryAdmin) return current === 'overview' ? 'admin' : current;
          return current === 'admin' ? 'overview' : current;
        });
        const allowed = profile.centers.some((center) => center.id === selectedCenterId);
        if (!allowed) {
          const nextId = profile.centers.length === 1 ? profile.centers[0].id : '';
          setSelectedCenterId(nextId);
          selectCenter(nextId);
        }
        setCenterError(profile.centers.length ? '' : 'Sua conta não possui centros ativos autorizados. Peça ao administrador principal que atribua um centro.');
      })
      .catch((error) => { setProfileError(error instanceof Error ? error.message : 'Não foi possível validar sua sessão na API.'); })
      .finally(() => setProfileLoading(false));
  // Load the authoritative profile once per login.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, profileAttempt]);

  useEffect(() => {
    if (!selectedCenterId && centers.length === 1) {
      setSelectedCenterId(centers[0].id);
      selectCenter(centers[0].id);
    }
  }, [centers, selectedCenterId]);

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={() => { const nextSession = getStoredSession(); setSession(nextSession); setActiveTab(nextSession?.user.isPrimaryAdmin ? 'admin' : 'overview'); setProfileLoading(true); setProfileError(''); setIsAuthenticated(true); }} />;
  }

  if (!session) return <LoginView onLoginSuccess={() => { const nextSession = getStoredSession(); setSession(nextSession); setActiveTab(nextSession?.user.isPrimaryAdmin ? 'admin' : 'overview'); setProfileLoading(true); setProfileError(''); setIsAuthenticated(true); }} />;

  if (profileLoading || profileError) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--color-canvas)' }}>
      <section className="card" style={{ width: 'min(100%, 480px)', padding: 28 }} aria-live="polite">
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>{profileLoading ? 'Validando sua sessão' : 'Não foi possível carregar seu painel'}</h1>
        {profileLoading ? <p style={{ color: 'var(--color-text-secondary)' }}>Conectando à API e carregando seus centros autorizados…</p> : <>
          <p role="alert" style={{ color: 'var(--color-danger-solid)', marginBottom: 16 }}>{profileError}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => setProfileAttempt((attempt) => attempt + 1)}>Tentar novamente</button>
            <button className="btn btn-secondary" onClick={() => { logout(); setSession(null); setIsAuthenticated(false); setProfileError(''); }}>Voltar ao login</button>
          </div>
        </>}
      </section>
    </div>;
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
        user={session.user}
        tenant={session.tenant}
        onLogout={() => { logout(); setSession(null); setIsAuthenticated(false); }}
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
        <Header
          activeTab={activeTab}
          centers={centers}
          selectedCenterId={selectedCenterId}
          onCenterChange={(id) => { selectCenter(id); setSelectedCenterId(id); }}
        />

        {/* Módulo Ativo */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: 'var(--color-canvas)',
          }}
        >
          {activeTab === 'admin' && session.user.isPrimaryAdmin ? <AdminView onCentersChanged={setCenters} /> : centerError ? <div role="alert" style={{ margin: 24, padding: 20 }}>{centerError}</div> : <>
            {activeTab === 'overview' && <OverviewView onNavigate={setActiveTab} />}
            {activeTab === 'sales' && <SalesView />}
            {activeTab === 'purchases' && <PurchasesView />}
            {activeTab === 'financial' && <FinancialView />}
            {activeTab === 'reconciliation' && <ReconciliationView />}
            {activeTab === 'products' && <ProductsView />}
            {activeTab === 'stock-movements' && <StockMovementsView />}
            {activeTab === 'contacts' && <ContactsView />}
          </>}
        </main>
      </div>
    </div>
  );
}

export default App;
