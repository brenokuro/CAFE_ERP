// frontend/src/views/StockMovementsView.tsx
import React, { useState, useMemo } from 'react';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Package,
  Layers,
  Clock,
  FileText,
  User,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Trash2,
  ShoppingCart,
  Warehouse,
  Plus,
  X,
} from 'lucide-react';
import { erpStore } from '../services/api';
import { StockMovement } from '../types/erp.types';

// ─── Tabela de domínio dos Tipos de Movimento (padrão SAP) ───────────────────
const MOVEMENT_TYPES: Record<
  string,
  { label: string; description: string; direction: 'IN' | 'OUT' | 'TRANSFER'; color: string; bg: string; border: string }
> = {
  '101': { label: '101 – Entrada Compra', description: 'Entrada por compra/fornecedor', direction: 'IN', color: '#15803d', bg: '#f0fdf4', border: '#86efac' },
  '201': { label: '201 – Consumo Produção', description: 'Baixa por consumo em produção/uso interno', direction: 'OUT', color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' },
  '202': { label: '202 – Estorno Consumo', description: 'Estorno de consumo por produção', direction: 'IN', color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd' },
  '301': { label: '301 – Transferência', description: 'Transferência entre centros/localizações', direction: 'TRANSFER', color: '#0891b2', bg: '#e0f2fe', border: '#7dd3fc' },
  '501': { label: '501 – Baixa Perda/Avaria', description: 'Baixa por perda, avaria ou vencimento', direction: 'OUT', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  '502': { label: '502 – Estorno de Baixa', description: 'Estorno de baixa por perda', direction: 'IN', color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
  '601': { label: '601 – Saída Venda', description: 'Saída gerada por faturamento de venda', direction: 'OUT', color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' },
  '602': { label: '602 – Devolução Venda', description: 'Retorno de mercadoria por devolução', direction: 'IN', color: '#15803d', bg: '#f0fdf4', border: '#86efac' },
};

const LEGACY_TYPE_MAP: Record<string, string> = {
  IN_PURCHASE: '101', IN_RETURN: '602', IN_ADJUSTMENT: '202',
  OUT_SALE: '601', OUT_RETURN: '301', OUT_LOSS: '501', OUT_ADJUSTMENT: '501',
};

function resolveCode(mov: StockMovement): string {
  if (mov.movementTypeCode && MOVEMENT_TYPES[mov.movementTypeCode]) return mov.movementTypeCode;
  if (mov.type && LEGACY_TYPE_MAP[mov.type]) return LEGACY_TYPE_MAP[mov.type];
  return mov.movementTypeCode || '---';
}

function MovementBadge({ code }: { code: string }) {
  const mt = MOVEMENT_TYPES[code];
  if (!mt) return <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{code}</span>;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 700,
      backgroundColor: mt.bg, color: mt.color, border: `1px solid ${mt.border}`, whiteSpace: 'nowrap',
    }}>
      {code}
    </span>
  );
}

function DirectionIcon({ code }: { code: string }) {
  const mt = MOVEMENT_TYPES[code];
  if (!mt) return <ArrowLeftRight size={14} color="var(--color-text-tertiary)" />;
  if (mt.direction === 'IN') return <ArrowUpCircle size={14} color="#16a34a" />;
  if (mt.direction === 'OUT') return <ArrowDownCircle size={14} color="#dc2626" />;
  return <ArrowLeftRight size={14} color="#0891b2" />;
}

// ─── Modal de nova movimentação avulsa ───────────────────────────────────────
interface NewMovementModalProps { onClose: () => void; onSuccess: (msg: string) => void; }
const NewMovementModal: React.FC<NewMovementModalProps> = ({ onClose, onSuccess }) => {
  const products = erpStore.products.filter((p) => p.type === 'PRODUCT');
  const [productId, setProductId] = useState('');
  const [code, setCode] = useState('501');
  const [qty, setQty] = useState('1.0000');
  const [docNumber, setDocNumber] = useState(`DOC-${Date.now().toString().slice(-5)}`);
  const [reason, setReason] = useState('');
  const [batchId, setBatchId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const selectedProduct = products.find((p) => p.id === productId);
  const requiresReason = ['501', '502', '202'].includes(code);
  const isEntry = ['101', '202', '502', '602'].includes(code);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!productId) return setError('Selecione um produto.');
    const quantity = parseFloat(qty);
    if (isNaN(quantity) || quantity <= 0) return setError('Quantidade deve ser um número positivo.');
    if (requiresReason && !reason.trim()) return setError('Justificativa obrigatória para este tipo de movimento.');
    const prod = erpStore.products.find((p) => p.id === productId);
    if (!prod) return setError('Produto não encontrado.');
    const prev = prod.currentStock;
    const cur = isEntry ? prev + quantity : prev - quantity;
    if (!isEntry && cur < 0) return setError(`Saldo insuficiente. Disponível: ${prev.toFixed(4)} ${prod.unitOfMeasure || prod.unit}. Solicitado: ${quantity.toFixed(4)}.`);
    if (prod.isBatchControlled && prod.batches && prod.batches.length > 0 && !isEntry) {
      const batch = batchId ? prod.batches.find((b) => b.id === batchId) : prod.batches[0];
      if (batch && batch.quantity < quantity) return setError(`Saldo insuficiente no lote "${batch.batchCode}". Disponível: ${batch.quantity.toFixed(4)}.`);
      if (batch) batch.quantity = isEntry ? batch.quantity + quantity : batch.quantity - quantity;
    }
    prod.currentStock = cur;
    const batchObj = batchId ? prod.batches?.find((bb) => bb.id === batchId) : undefined;
    erpStore.stockMovements.unshift({
      id: `sm-${Date.now()}`, productId: prod.id, batchId: batchId || undefined,
      movementTypeCode: code,
      product: { sku: prod.sku, name: prod.name, unitOfMeasure: prod.unitOfMeasure || prod.unit },
      batch: batchObj ? { batchCode: batchObj.batchCode, expirationDate: batchObj.expirationDate } : undefined,
      type: isEntry ? 'IN_ADJUSTMENT' : 'OUT_LOSS',
      quantity, previousStock: prev, currentStock: cur, newStock: cur,
      unitCost: prod.costPrice, totalCost: quantity * prod.costPrice,
      documentNumber: docNumber, referenceType: 'MANUAL', reason: reason || undefined,
      createdAt: new Date().toISOString(), createdByUser: { name: erpStore.user.name },
    });
    onSuccess(`Movimento [${code}] lançado para "${prod.name}". Saldo: ${prev.toFixed(4)} → ${cur.toFixed(4)} ${prod.unitOfMeasure || prod.unit}.`);
    onClose();
  };

  return (
    <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(2px)' }}>
      <div style={{ backgroundColor:'var(--color-surface)', borderRadius:'var(--radius-md)', border:'1px solid var(--color-border-subtle)', width:'520px', maxWidth:'95vw', padding:'24px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
          <div>
            <h3 style={{ margin:0, fontSize:'15px', fontWeight:700, color:'var(--color-text-primary)' }}>Lançar Movimentação Avulsa</h3>
            <p style={{ margin:'2px 0 0', fontSize:'12px', color:'var(--color-text-secondary)' }}>Motor auditável com código SAP — garantia ACID</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-tertiary)', padding:'4px' }}><X size={18} /></button>
        </div>
        {error && (
          <div style={{ marginBottom:'14px', padding:'8px 12px', backgroundColor:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'var(--radius-sm)', color:'#dc2626', fontSize:'12px', display:'flex', alignItems:'center', gap:'6px' }}>
            <AlertTriangle size={13} /><span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <div>
            <label style={{ fontSize:'11.5px', fontWeight:600, color:'var(--color-text-secondary)', display:'block', marginBottom:'4px' }}>Produto / Insumo *</label>
            <select value={productId} onChange={(e) => { setProductId(e.target.value); setBatchId(''); }}
              style={{ width:'100%', padding:'7px 10px', fontSize:'12.5px', borderRadius:'var(--radius-sm)', border:'1px solid var(--color-border-default)', backgroundColor:'var(--color-surface)', color:'var(--color-text-primary)' }} required>
              <option value="">Selecione...</option>
              {products.map((p) => <option key={p.id} value={p.id}>[{p.sku}] {p.name} — Saldo: {Number(p.currentStock).toFixed(4)} {p.unitOfMeasure || p.unit}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:'11.5px', fontWeight:600, color:'var(--color-text-secondary)', display:'block', marginBottom:'4px' }}>Tipo de Movimento (Código SAP) *</label>
            <select value={code} onChange={(e) => setCode(e.target.value)}
              style={{ width:'100%', padding:'7px 10px', fontSize:'12.5px', borderRadius:'var(--radius-sm)', border:'1px solid var(--color-border-default)', backgroundColor:'var(--color-surface)', color:'var(--color-text-primary)' }}>
              {Object.entries(MOVEMENT_TYPES).map(([k, v]) => <option key={k} value={k}>{k} — {v.description}</option>)}
            </select>
            {MOVEMENT_TYPES[code] && (
              <div style={{ marginTop:'6px', display:'flex', alignItems:'center', gap:'8px' }}>
                <MovementBadge code={code} />
                <span style={{ fontSize:'11px', color:'var(--color-text-tertiary)' }}>
                  {MOVEMENT_TYPES[code].direction === 'IN' ? '↑ Aumenta saldo' : MOVEMENT_TYPES[code].direction === 'OUT' ? '↓ Reduz saldo' : '↔ Transferência'}
                </span>
              </div>
            )}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <div>
              <label style={{ fontSize:'11.5px', fontWeight:600, color:'var(--color-text-secondary)', display:'block', marginBottom:'4px' }}>
                Quantidade *{selectedProduct ? ` (${selectedProduct.unitOfMeasure || selectedProduct.unit})` : ''}
              </label>
              <input type="number" step="0.0001" min="0.0001" value={qty} onChange={(e) => setQty(e.target.value)}
                style={{ width:'100%', padding:'7px 10px', fontSize:'12.5px', borderRadius:'var(--radius-sm)', border:'1px solid var(--color-border-default)', backgroundColor:'var(--color-surface)', color:'var(--color-text-primary)', boxSizing:'border-box' }} required />
            </div>
            <div>
              <label style={{ fontSize:'11.5px', fontWeight:600, color:'var(--color-text-secondary)', display:'block', marginBottom:'4px' }}>Nº Documento</label>
              <input type="text" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="OP-001, NF-1234..."
                style={{ width:'100%', padding:'7px 10px', fontSize:'12.5px', borderRadius:'var(--radius-sm)', border:'1px solid var(--color-border-default)', backgroundColor:'var(--color-surface)', color:'var(--color-text-primary)', boxSizing:'border-box' }} />
            </div>
          </div>
          {selectedProduct?.isBatchControlled && selectedProduct.batches && selectedProduct.batches.length > 0 && (
            <div>
              <label style={{ fontSize:'11.5px', fontWeight:600, color:'var(--color-text-secondary)', display:'block', marginBottom:'4px' }}>
                Lote {!isEntry ? '(FIFO — vazio = automático)' : ''}
              </label>
              <select value={batchId} onChange={(e) => setBatchId(e.target.value)}
                style={{ width:'100%', padding:'7px 10px', fontSize:'12.5px', borderRadius:'var(--radius-sm)', border:'1px solid var(--color-border-default)', backgroundColor:'var(--color-surface)', color:'var(--color-text-primary)' }}>
                <option value="">{!isEntry ? 'Automático (FIFO/FEFO)' : 'Selecione o lote...'}</option>
                {selectedProduct.batches.map((b) => <option key={b.id} value={b.id}>{b.batchCode} — Saldo: {Number(b.quantity).toFixed(4)} | Val.: {b.expirationDate || 'Sem validade'}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={{ fontSize:'11.5px', fontWeight:600, color:requiresReason ? '#dc2626' : 'var(--color-text-secondary)', display:'block', marginBottom:'4px' }}>
              Justificativa {requiresReason ? '* (obrigatória para 501/502/202)' : '(opcional)'}
            </label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} required={requiresReason}
              placeholder={requiresReason ? 'Ex.: Filamento úmido descartado, insumo vencido...' : 'Observação opcional...'}
              style={{ width:'100%', padding:'7px 10px', fontSize:'12.5px', borderRadius:'var(--radius-sm)', border:`1px solid ${requiresReason ? '#fca5a5' : 'var(--color-border-default)'}`, backgroundColor:'var(--color-surface)', color:'var(--color-text-primary)', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' }} />
          </div>
          <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end', paddingTop:'4px' }}>
            <button type="button" onClick={onClose} style={{ padding:'7px 16px', fontSize:'13px', fontWeight:500, borderRadius:'var(--radius-sm)', border:'1px solid var(--color-border-subtle)', backgroundColor:'transparent', color:'var(--color-text-secondary)', cursor:'pointer' }}>Cancelar</button>
            <button type="submit" style={{ padding:'7px 18px', fontSize:'13px', fontWeight:600, borderRadius:'var(--radius-sm)', border:'none', backgroundColor:'var(--color-primary)', color:'#fff', cursor:'pointer' }}>Confirmar Movimento</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, color, bg }: { label:string; value:string|number; sub?:string; icon:React.ReactNode; color:string; bg:string; }) {
  return (
    <div style={{ backgroundColor:'var(--color-surface)', border:'1px solid var(--color-border-subtle)', borderRadius:'var(--radius-md)', padding:'14px 16px', display:'flex', alignItems:'flex-start', gap:'12px' }}>
      <div style={{ width:'36px', height:'36px', borderRadius:'var(--radius-sm)', backgroundColor:bg, display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontSize:'11px', color:'var(--color-text-tertiary)', fontWeight:500 }}>{label}</div>
        <div style={{ fontSize:'20px', fontWeight:700, color:'var(--color-text-primary)', lineHeight:1.2 }}>{value}</div>
        {sub && <div style={{ fontSize:'11px', color:'var(--color-text-secondary)', marginTop:'2px' }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────
export const StockMovementsView: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([...erpStore.stockMovements]);
  const [filterCode, setFilterCode] = useState<string>('ALL');
  const [filterProduct, setFilterProduct] = useState<string>('ALL');
  const [filterDirection, setFilterDirection] = useState<string>('ALL');
  const [searchDoc, setSearchDoc] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const products = erpStore.products.filter((p) => p.type === 'PRODUCT');
  const refresh = () => setMovements([...erpStore.stockMovements]);

  const filtered = useMemo(() => {
    return movements.filter((m) => {
      const code = resolveCode(m);
      const mt = MOVEMENT_TYPES[code];
      if (filterCode !== 'ALL' && code !== filterCode) return false;
      if (filterProduct !== 'ALL' && m.productId !== filterProduct) return false;
      if (filterDirection !== 'ALL' && mt?.direction !== filterDirection) return false;
      if (searchDoc && !(m.documentNumber || '').toLowerCase().includes(searchDoc.toLowerCase())) return false;
      return true;
    });
  }, [movements, filterCode, filterProduct, filterDirection, searchDoc]);

  const totalIn = movements.filter((m) => MOVEMENT_TYPES[resolveCode(m)]?.direction === 'IN').length;
  const totalOut = movements.filter((m) => MOVEMENT_TYPES[resolveCode(m)]?.direction === 'OUT').length;
  const totalLoss = movements.filter((m) => resolveCode(m) === '501').length;
  const totalVolume = movements.reduce((acc, m) => acc + Number(m.quantity), 0);

  return (
    <div style={{ padding:'20px', maxWidth:'1400px', margin:'0 auto' }}>
      {successMessage && (
        <div style={{ marginBottom:'16px', padding:'10px 14px', backgroundColor:'#f0fdf4', border:'1px solid #86efac', borderRadius:'var(--radius-sm)', color:'#15803d', fontSize:'12.5px', display:'flex', alignItems:'center', gap:'8px' }}>
          <CheckCircle2 size={15} color="#16a34a" />
          <span style={{ flex:1 }}>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#15803d', padding:'0 2px' }}><X size={14} /></button>
        </div>
      )}

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px', gap:'16px' }}>
        <div>
          <h2 style={{ margin:0, fontSize:'16px', fontWeight:700, color:'var(--color-text-primary)' }}>Motor de Movimentações de Estoque</h2>
          <p style={{ margin:'3px 0 0', fontSize:'12px', color:'var(--color-text-secondary)' }}>Histórico auditável com rastreabilidade por lote, FIFO/FEFO e códigos SAP (101, 201, 501…)</p>
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', fontSize:'13px', fontWeight:600, backgroundColor:'var(--color-primary)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer', flexShrink:0 }}>
          <Plus size={15} />Novo Movimento
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'12px', marginBottom:'20px' }}>
        <KpiCard label="Total de Registros" value={movements.length} sub="todas as movimentações" icon={<FileText size={18} />} color="#1d4ed8" bg="#eff6ff" />
        <KpiCard label="Entradas (IN)" value={totalIn} sub="101, 202, 502, 602" icon={<ArrowUpCircle size={18} />} color="#15803d" bg="#f0fdf4" />
        <KpiCard label="Saídas (OUT)" value={totalOut} sub="201, 501, 601" icon={<ArrowDownCircle size={18} />} color="#dc2626" bg="#fef2f2" />
        <KpiCard label="Baixas por Perda (501)" value={totalLoss} sub={`Volume total: ${totalVolume.toFixed(2)}`} icon={<AlertTriangle size={18} />} color="#b45309" bg="#fef3c7" />
      </div>

      {/* Legenda dos Códigos */}
      <div style={{ backgroundColor:'var(--color-surface)', border:'1px solid var(--color-border-subtle)', borderRadius:'var(--radius-md)', padding:'14px 16px', marginBottom:'16px' }}>
        <div style={{ fontSize:'11px', fontWeight:600, color:'var(--color-text-tertiary)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'10px' }}>Tabela de Tipos de Movimento — Padrão SAP (clique para filtrar)</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
          {Object.entries(MOVEMENT_TYPES).map(([code, mt]) => (
            <button key={code} onClick={() => setFilterCode(filterCode === code ? 'ALL' : code)} title={mt.description}
              style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'4px 12px', borderRadius:'100px', fontSize:'11.5px', fontWeight:600,
                backgroundColor: filterCode === code ? mt.color : mt.bg, color: filterCode === code ? '#fff' : mt.color,
                border:`1px solid ${mt.border}`, cursor:'pointer', transition:'all 0.15s' }}>
              <span>{code}</span>
              <span style={{ fontWeight:400, opacity:0.85 }}>— {mt.description}</span>
            </button>
          ))}
          {filterCode !== 'ALL' && (
            <button onClick={() => setFilterCode('ALL')}
              style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'4px 10px', borderRadius:'100px', fontSize:'11.5px', fontWeight:500, backgroundColor:'transparent', color:'var(--color-text-tertiary)', border:'1px dashed var(--color-border-subtle)', cursor:'pointer' }}>
              <X size={11} /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:'1', minWidth:'180px' }}>
          <Search size={13} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'var(--color-text-tertiary)' }} />
          <input type="text" value={searchDoc} onChange={(e) => setSearchDoc(e.target.value)} placeholder="Buscar por nº documento..."
            style={{ width:'100%', padding:'6px 10px 6px 30px', fontSize:'12.5px', borderRadius:'var(--radius-sm)', border:'1px solid var(--color-border-default)', backgroundColor:'var(--color-surface)', color:'var(--color-text-primary)', boxSizing:'border-box' }} />
        </div>
        <select value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)}
          style={{ padding:'6px 10px', fontSize:'12px', borderRadius:'var(--radius-sm)', border:'1px solid var(--color-border-default)', backgroundColor:'var(--color-surface)', color:'var(--color-text-secondary)' }}>
          <option value="ALL">Todos os produtos</option>
          {products.map((p) => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
        </select>
        <div style={{ display:'inline-flex', backgroundColor:'var(--color-surface)', border:'1px solid var(--color-border-subtle)', borderRadius:'var(--radius-sm)', padding:'2px' }}>
          {[{ id:'ALL', label:'Todos' }, { id:'IN', label:'↑ Entradas' }, { id:'OUT', label:'↓ Saídas' }, { id:'TRANSFER', label:'↔ Transfer.' }].map((btn) => (
            <button key={btn.id} onClick={() => setFilterDirection(btn.id)}
              style={{ padding:'4px 10px', fontSize:'11.5px', fontWeight:filterDirection === btn.id ? 600 : 500, backgroundColor:filterDirection === btn.id ? 'var(--color-surface-selected)' : 'transparent', color:filterDirection === btn.id ? 'var(--color-primary)' : 'var(--color-text-secondary)', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer' }}>
              {btn.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft:'auto', fontSize:'12px', color:'var(--color-text-tertiary)', flexShrink:0 }}>
          <Filter size={12} style={{ verticalAlign:'middle', marginRight:'4px' }} /><strong>{filtered.length}</strong> de {movements.length} registros
        </div>
      </div>

      {/* Tabela */}
      <div className="table-container">
        <table className="table-dense">
          <thead>
            <tr>
              <th style={{ width:'42px' }}>Dir.</th>
              <th style={{ width:'130px' }}>Código SAP</th>
              <th style={{ width:'100px' }}>Documento</th>
              <th>Produto / Insumo</th>
              <th style={{ width:'120px' }}>Lote</th>
              <th className="col-num" style={{ width:'115px' }}>Quantidade</th>
              <th className="col-num" style={{ width:'105px' }}>Saldo Ant.</th>
              <th className="col-num" style={{ width:'105px' }}>Saldo Novo</th>
              <th className="col-num" style={{ width:'100px' }}>Custo Total</th>
              <th style={{ width:'120px' }}>Data / Hora</th>
              <th style={{ width:'110px' }}>Operador</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={11} style={{ textAlign:'center', padding:'32px', color:'var(--color-text-tertiary)', fontSize:'13px' }}>
                <Package size={28} style={{ display:'block', margin:'0 auto 8px', opacity:0.3 }} />
                Nenhuma movimentação encontrada com os filtros atuais.
              </td></tr>
            ) : (
              filtered.map((mov) => {
                const code = resolveCode(mov);
                const mt = MOVEMENT_TYPES[code];
                const isEntry = mt?.direction === 'IN';
                const isLoss = code === '501';
                const qtyColor = isEntry ? '#16a34a' : isLoss ? '#dc2626' : 'var(--color-text-primary)';
                const dateObj = new Date(mov.createdAt);
                const dateStr = dateObj.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' });
                const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
                return (
                  <tr key={mov.id} title={mov.reason ? `Justificativa: ${mov.reason}` : undefined}>
                    <td style={{ textAlign:'center' }}><DirectionIcon code={code} /></td>
                    <td><MovementBadge code={code} /></td>
                    <td>
                      <span style={{ fontSize:'11px', fontFamily:'monospace', backgroundColor:'var(--color-surface-subtle)', padding:'2px 6px', borderRadius:'4px', color:'var(--color-text-secondary)', whiteSpace:'nowrap' }}>
                        {mov.documentNumber || '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:'flex', flexDirection:'column', gap:'1px' }}>
                        <span style={{ fontSize:'12.5px', fontWeight:600, color:'var(--color-text-primary)' }}>{mov.product?.name || mov.productId}</span>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                          <span style={{ fontSize:'10.5px', color:'var(--color-text-tertiary)', fontFamily:'monospace' }}>{mov.product?.sku}</span>
                          {mov.reason && <span style={{ fontSize:'10px', color: isLoss ? '#dc2626' : 'var(--color-text-tertiary)', fontStyle:'italic', maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={mov.reason}>{mov.reason}</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      {mov.batch ? (
                        <div style={{ display:'flex', flexDirection:'column', gap:'1px' }}>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', fontSize:'11px', fontWeight:600, fontFamily:'monospace', backgroundColor:'#eff6ff', color:'#1d4ed8', padding:'1px 6px', borderRadius:'4px' }}>
                            <Layers size={10} />{mov.batch.batchCode}
                          </span>
                          {mov.batch.expirationDate && <span style={{ fontSize:'10px', color:'var(--color-text-tertiary)' }}><Clock size={9} style={{ verticalAlign:'middle', marginRight:'2px' }} />val. {mov.batch.expirationDate}</span>}
                        </div>
                      ) : <span style={{ color:'var(--color-text-tertiary)', fontSize:'11px' }}>—</span>}
                    </td>
                    <td className="col-num">
                      <span style={{ fontWeight:700, fontFamily:'monospace', fontSize:'13px', color:qtyColor }}>{isEntry ? '+' : '−'}&nbsp;{Number(mov.quantity).toFixed(4)}</span>
                      <span style={{ fontSize:'10px', color:'var(--color-text-tertiary)', marginLeft:'3px' }}>{mov.product?.unitOfMeasure || ''}</span>
                    </td>
                    <td className="col-num"><span style={{ fontFamily:'monospace', fontSize:'12px', color:'var(--color-text-secondary)' }}>{Number(mov.previousStock).toFixed(4)}</span></td>
                    <td className="col-num"><span style={{ fontFamily:'monospace', fontSize:'12px', fontWeight:600, color:'var(--color-text-primary)' }}>{Number(mov.newStock ?? mov.currentStock).toFixed(4)}</span></td>
                    <td className="col-num">
                      {mov.totalCost != null
                        ? <span style={{ fontFamily:'monospace', fontSize:'12px', color:'var(--color-text-secondary)' }}>R$&nbsp;{Number(mov.totalCost).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 })}</span>
                        : <span style={{ color:'var(--color-text-tertiary)', fontSize:'11px' }}>—</span>}
                    </td>
                    <td>
                      <div style={{ fontSize:'12px', color:'var(--color-text-primary)', fontWeight:500 }}>{dateStr}</div>
                      <div style={{ fontSize:'10.5px', color:'var(--color-text-tertiary)' }}>{timeStr}</div>
                    </td>
                    <td>
                      {mov.createdByUser ? (
                        <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                          <div style={{ width:'20px', height:'20px', borderRadius:'50%', backgroundColor:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><User size={11} color="#1d4ed8" /></div>
                          <span style={{ fontSize:'11.5px', color:'var(--color-text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={mov.createdByUser.name}>{mov.createdByUser.name.split(' ')[0]}</span>
                        </div>
                      ) : <span style={{ color:'var(--color-text-tertiary)', fontSize:'11px' }}>Sistema</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop:'12px', padding:'10px 14px', backgroundColor:'var(--color-surface)', border:'1px solid var(--color-border-subtle)', borderRadius:'var(--radius-sm)', display:'flex', gap:'24px', flexWrap:'wrap' }}>
        <div style={{ fontSize:'11px', color:'var(--color-text-tertiary)' }}><strong style={{ color:'var(--color-text-secondary)' }}>Saldo Ant./Novo:</strong> snapshot imutável gravado no momento da operação</div>
        <div style={{ fontSize:'11px', color:'var(--color-text-tertiary)' }}><strong style={{ color:'var(--color-text-secondary)' }}>FIFO/FEFO:</strong> sem lote informado, baixa automaticamente no lote mais próximo ao vencimento</div>
        <div style={{ fontSize:'11px', color:'var(--color-text-tertiary)' }}><strong style={{ color:'var(--color-text-secondary)' }}>Justificativa:</strong> obrigatória para os códigos 501 (Perda), 502 (Estorno Baixa) e 202 (Estorno Consumo)</div>
      </div>

      {showModal && <NewMovementModal onClose={() => setShowModal(false)} onSuccess={(msg) => { refresh(); setSuccessMessage(msg); }} />}
    </div>
  );
};
