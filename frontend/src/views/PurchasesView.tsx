// frontend/src/views/PurchasesView.tsx
import React, { useState } from 'react';
import { Plus, CheckCircle, Truck, ShieldCheck } from 'lucide-react';
import { erpStore } from '../services/api';
import { PurchaseOrder, StockMovement, Contact, Product } from '../types/erp.types';

export const PurchasesView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'purchases' | 'stockAudit'>('purchases');
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([...erpStore.purchaseOrders]);
  const [movements, setMovements] = useState<StockMovement[]>([...erpStore.stockMovements]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Formulário de Nova Compra
  const [selectedSupplierId, setSelectedSupplierId] = useState(
    erpStore.contacts.find((c: Contact) => c.role === 'SUPPLIER' || c.role === 'BOTH')?.id || '',
  );
  const [invoiceKey, setInvoiceKey] = useState('35261019822401000112550010000491021982341012');
  const [invoiceNumber, setInvoiceNumber] = useState('000.088.194');
  const [items, setItems] = useState<{ productId: string; quantity: number; unitCost: number }[]>([
    { productId: erpStore.products[0]?.id || '', quantity: 5, unitCost: 430.00 },
  ]);
  const [receiveNow, setReceiveNow] = useState(true);

  const handleAddItem = () => {
    const firstProd = erpStore.products[0];
    setItems([
      ...items,
      { productId: firstProd?.id || '', quantity: 1, unitCost: firstProd?.costPrice || 0 },
    ]);
  };

  const handleProductChange = (index: number, productId: string) => {
    const prod = erpStore.products.find((p: Product) => p.id === productId);
    const updated = [...items];
    updated[index].productId = productId;
    if (prod) {
      updated[index].unitCost = prod.costPrice;
    }
    setItems(updated);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, qty);
    setItems(updated);
  };

  const handleCostChange = (index: number, cost: number) => {
    const updated = [...items];
    updated[index].unitCost = Math.max(0, cost);
    setItems(updated);
  };

  const calculatedTotal = items.reduce((acc, it) => acc + it.quantity * it.unitCost, 0);

  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newPurchase = erpStore.createPurchaseOrder({
        supplierId: selectedSupplierId,
        items,
        invoiceKey,
        invoiceNumber,
        receiveNow,
        installmentsCount: 1,
      });

      setPurchases([...erpStore.purchaseOrders]);
      setMovements([...erpStore.stockMovements]);
      setIsModalOpen(false);
      setSuccessMessage(
        receiveNow
          ? `Compra #${newPurchase.orderNumber} recebida! Estoque acrescido, custo médio recalculado e Contas a Pagar gerado.`
          : `Compra #${newPurchase.orderNumber} cadastrada como cotação.`,
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReceiveExisting = (purchaseId: string) => {
    try {
      erpStore.receivePurchaseOrder(purchaseId, 1);
      setPurchases([...erpStore.purchaseOrders]);
      setMovements([...erpStore.stockMovements]);
      setSuccessMessage('Entrada confirmada! Estoque atualizado e contas a pagar gerado.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 1. NOTIFICAÇÃO DISCRETA */}
      {successMessage && (
        <div
          style={{
            marginBottom: '16px',
            padding: '10px 14px',
            backgroundColor: 'var(--color-success-bg)',
            border: '1px solid var(--color-success-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-success-text)',
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle size={15} color="var(--color-success-solid)" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. BARRA SUPERIOR: ABAS E BOTÃO DE AÇÃO */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px',
          }}
        >
          <button
            onClick={() => setActiveSubTab('purchases')}
            style={{
              height: '28px',
              padding: '0 12px',
              fontSize: '12px',
              fontWeight: activeSubTab === 'purchases' ? 600 : 500,
              color: activeSubTab === 'purchases' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
              backgroundColor: activeSubTab === 'purchases' ? 'var(--color-primary-50)' : 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-xs)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Truck size={14} />
            <span>Pedidos de Compra ({purchases.length})</span>
          </button>
          <button
            onClick={() => {
              setMovements([...erpStore.stockMovements]);
              setActiveSubTab('stockAudit');
            }}
            style={{
              height: '28px',
              padding: '0 12px',
              fontSize: '12px',
              fontWeight: activeSubTab === 'stockAudit' ? 600 : 500,
              color: activeSubTab === 'stockAudit' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
              backgroundColor: activeSubTab === 'stockAudit' ? 'var(--color-primary-50)' : 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-xs)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShieldCheck size={14} />
            <span>Movimentações de Estoque ({movements.length})</span>
          </button>
        </div>

        {activeSubTab === 'purchases' && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={15} />
            <span>Nova Compra / Entrada NF-e</span>
          </button>
        )}
      </div>

      {/* 3. CONTEÚDO PRINCIPAL: TABELAS */}
      {activeSubTab === 'purchases' ? (
        <div className="table-container">
          <table className="table-dense">
            <thead>
              <tr>
                <th style={{ width: '90px' }}>Nº Compra</th>
                <th style={{ width: '120px' }}>NF-e / Série</th>
                <th>Fornecedor</th>
                <th>Itens Recebidos</th>
                <th style={{ width: '100px' }}>Data</th>
                <th className="col-num" style={{ width: '120px' }}>Total Líquido</th>
                <th style={{ width: '110px' }}>Status</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => {
                const isDraft = purchase.status === 'DRAFT';
                return (
                  <tr key={purchase.id}>
                    <td style={{ fontWeight: 600, color: 'var(--color-primary-600)' }}>
                      #{purchase.orderNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>{purchase.invoiceNumber || 'S/N'}</div>
                      {purchase.invoiceKey && (
                        <div
                          style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}
                          title={purchase.invoiceKey}
                        >
                          {purchase.invoiceKey.substring(0, 15)}...
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{purchase.supplier?.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{purchase.supplier?.document}</div>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>
                      {purchase.items.map((i: any) => `${i.quantity}x ${i.product?.sku}`).join(', ')}
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{purchase.issueDate}</td>
                    <td className="col-num" style={{ fontWeight: 600 }}>
                      R$ {purchase.totalNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`status-badge ${purchase.status === 'RECEIVED' ? 'success' : 'warning'}`}>
                        <span className={`status-dot ${purchase.status === 'RECEIVED' ? 'success' : 'warning'}`} />
                        {purchase.status === 'RECEIVED' ? 'Recebido' : 'Cotação'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isDraft && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleReceiveExisting(purchase.id)}
                          title="Dar entrada no estoque e gerar contas a pagar"
                        >
                          <CheckCircle size={13} />
                          <span>Receber</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Trilha Auditável de Estoque (StockMovements) */
        <div className="table-container">
          <table className="table-dense">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Data / Hora</th>
                <th style={{ width: '100px' }}>Tipo</th>
                <th>Produto (SKU - Nome)</th>
                <th className="col-num" style={{ width: '90px' }}>Qtd</th>
                <th className="col-num" style={{ width: '100px' }}>Saldo Ant.</th>
                <th className="col-num" style={{ width: '100px' }}>Saldo Novo</th>
                <th className="col-num" style={{ width: '110px' }}>Custo Un.</th>
                <th>Referência</th>
                <th>Operador</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((mov) => {
                const isEntry = mov.type.startsWith('IN_');
                return (
                  <tr key={mov.id}>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '11.5px' }}>
                      {new Date(mov.createdAt).toLocaleDateString('pt-BR')} {new Date(mov.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <span className={`status-badge ${isEntry ? 'success' : 'danger'}`}>
                        {isEntry ? 'Entrada (+)' : 'Saída (-)'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{mov.product?.name || mov.productId}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>SKU: {mov.product?.sku}</div>
                    </td>
                    <td className="col-num" style={{ fontWeight: 600, color: isEntry ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                      {isEntry ? `+${mov.quantity}` : `-${mov.quantity}`}
                    </td>
                    <td className="col-num" style={{ color: 'var(--color-text-tertiary)' }}>
                      {mov.previousStock}
                    </td>
                    <td className="col-num" style={{ fontWeight: 600 }}>
                      {mov.currentStock}
                    </td>
                    <td className="col-num">
                      R$ {(mov.unitCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>
                      {mov.referenceType} ({mov.referenceId})
                    </td>
                    <td style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>
                      {mov.createdByUser?.name || 'Sistema'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. MODAL DE NOVA COMPRA */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 'var(--z-modal)',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              width: '100%',
              maxWidth: '680px',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-modal)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--color-border-subtle)',
                backgroundColor: 'var(--color-surface-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h2 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Entrada de Compra & NF-e</h2>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  Atualiza estoque, recalcula Custo Médio Ponderado (CMP) e gera Contas a Pagar
                </span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} style={{ padding: '18px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Fornecedor
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    {erpStore.contacts
                      .filter((c: Contact) => c.role === 'SUPPLIER' || c.role === 'BOTH')
                      .map((c: Contact) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Número da NF-e
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Chave de 44 dígitos da NF-e */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Chave de Acesso NF-e (44 dígitos)
                </label>
                <input
                  type="text"
                  maxLength={44}
                  value={invoiceKey}
                  onChange={(e) => setInvoiceKey(e.target.value)}
                  style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                />
              </div>

              {/* Tabela de Itens da Compra com CMP Preview */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    Itens da Nota / Produtos
                  </label>
                  <button type="button" onClick={handleAddItem} className="btn btn-secondary btn-sm">
                    <Plus size={13} />
                    <span>Adicionar Produto</span>
                  </button>
                </div>

                <div className="table-container">
                  <table className="table-dense">
                    <thead>
                      <tr>
                        <th>Produto</th>
                        <th style={{ width: '70px' }}>Qtd</th>
                        <th className="col-num" style={{ width: '100px' }}>Custo Un.</th>
                        <th className="col-num" style={{ width: '110px' }}>Subtotal</th>
                        <th style={{ width: '130px' }}>Novo CMP (Est.)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => {
                        const product = erpStore.products.find((p: Product) => p.id === it.productId);
                        const subtotal = it.quantity * it.unitCost;

                        let newEstimatedCmp = it.unitCost;
                        if (product) {
                          const currentVal = product.currentStock * product.costPrice;
                          const incomingVal = it.quantity * it.unitCost;
                          const newTotalQty = product.currentStock + it.quantity;
                          if (newTotalQty > 0) {
                            newEstimatedCmp = (currentVal + incomingVal) / newTotalQty;
                          }
                        }

                        return (
                          <tr key={idx}>
                            <td>
                              <select
                                value={it.productId}
                                onChange={(e) => handleProductChange(idx, e.target.value)}
                                style={{ width: '100%', height: '28px', fontSize: '12px' }}
                              >
                                {erpStore.products
                                  .filter((p: Product) => p.type === 'PRODUCT')
                                  .map((p: Product) => (
                                    <option key={p.id} value={p.id}>
                                      {p.sku} - {p.name} (Atual: {p.currentStock} {p.unit} a R$ {p.costPrice.toFixed(2)})
                                    </option>
                                  ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                value={it.quantity}
                                onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                                style={{ width: '100%', height: '28px', textAlign: 'center' }}
                              />
                            </td>
                            <td className="col-num">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={it.unitCost}
                                onChange={(e) => handleCostChange(idx, Number(e.target.value))}
                                style={{ width: '100%', height: '28px', textAlign: 'right' }}
                              />
                            </td>
                            <td className="col-num" style={{ fontWeight: 600 }}>
                              R$ {subtotal.toFixed(2)}
                            </td>
                            <td style={{ fontSize: '11px', color: 'var(--color-primary-600)', fontWeight: 600 }}>
                              R$ {newEstimatedCmp.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Entrada Imediata */}
              <div
                style={{
                  backgroundColor: 'var(--color-surface-subtle)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-subtle)',
                  marginBottom: '16px',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={receiveNow}
                    onChange={(e) => setReceiveNow(e.target.checked)}
                    style={{ width: '15px', height: '15px', accentColor: 'var(--color-primary-600)' }}
                  />
                  <span>Dar entrada imediata na mercadoria (Atualiza Estoque + Contas a Pagar)</span>
                </label>
              </div>

              {/* Total da Compra */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'baseline',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Total da Nota / Compra:</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  R$ {calculatedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {receiveNow ? 'Confirmar Entrada de Mercadoria' : 'Salvar Cotação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
