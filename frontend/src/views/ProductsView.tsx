// frontend/src/views/ProductsView.tsx
import React, { useState } from 'react';
import { AlertTriangle, SlidersHorizontal, CheckCircle2, Layers, Calendar, Tag } from 'lucide-react';
import { erpStore } from '../services/api';
import { Product, ProductBatch } from '../types/erp.types';

export const ProductsView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([...erpStore.products]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [selectedProductForAdjustment, setSelectedProductForAdjustment] = useState<Product | null>(null);

  // Form de Ajuste e Movimentação com Motor SAP
  const [movementCode, setMovementCode] = useState<string>('501'); // Padrão: Baixa por Perda/Avaria
  const [adjustQty, setAdjustQty] = useState<number>(1.0000);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [documentNumber, setDocumentNumber] = useState<string>('DOC-MANUAL-01');
  const [adjustReason, setAdjustReason] = useState<string>('Avaria / Insumo úmido descartado');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filtered = products.filter((p: Product) => {
    const matchesType = filterType === 'ALL' || p.type === filterType;
    const matchesStock = !filterLowStock || (p.type === 'PRODUCT' && p.currentStock <= p.minStock);
    return matchesType && matchesStock;
  });

  const handleOpenAdjustment = (prod: Product) => {
    setSelectedProductForAdjustment(prod);
    setMovementCode('501');
    setAdjustQty(prod.unitOfMeasure === 'KG' || prod.unitOfMeasure === 'L' ? 0.5000 : 1.0000);
    setDocumentNumber(`DOC-${Date.now().toString().slice(-4)}`);
    setAdjustReason(prod.isBatchControlled ? 'Filamento úmido / insumo quebrado' : 'Ajuste de inventário físico');
    if (prod.batches && prod.batches.length > 0) {
      setSelectedBatchId(prod.batches[0].id);
    } else {
      setSelectedBatchId('');
    }
  };

  const handleConfirmAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdjustment) return;

    const prod = selectedProductForAdjustment;
    const isEntry = ['101', '202', '502'].includes(movementCode);
    const prev = prod.currentStock;
    const cur = isEntry ? prev + adjustQty : prev - adjustQty;

    if (!isEntry && cur < 0) {
      alert(`Saldo insuficiente. Saldo disponível: ${prev.toFixed(4)} ${prod.unitOfMeasure || prod.unit}. Solicitado: ${adjustQty.toFixed(4)}.`);
      return;
    }

    // Validação de justificativa obrigatória para perdas/estornos
    if (['501', '502', '202'].includes(movementCode) && (!adjustReason || adjustReason.trim().length === 0)) {
      alert('A justificativa é obrigatória para movimentações de perda ou estorno (códigos 501, 502, 202).');
      return;
    }

    // Atualização de lote se houver
    let batchInfo: any = undefined;
    if (prod.isBatchControlled && prod.batches && prod.batches.length > 0) {
      const b = prod.batches.find((item: ProductBatch) => item.id === selectedBatchId) || prod.batches[0];
      if (b) {
        if (!isEntry && b.quantity < adjustQty) {
          alert(`Saldo insuficiente no lote "${b.batchCode}". Saldo no lote: ${b.quantity.toFixed(4)}.`);
          return;
        }
        b.quantity = isEntry ? b.quantity + adjustQty : b.quantity - adjustQty;
        batchInfo = { batchCode: b.batchCode, expirationDate: b.expirationDate };
      }
    }

    prod.currentStock = cur;
    erpStore.stockMovements.unshift({
      id: `sm-${Date.now()}`,
      productId: prod.id,
      batchId: selectedBatchId || undefined,
      movementTypeCode: movementCode,
      product: { sku: prod.sku, name: prod.name, unitOfMeasure: prod.unitOfMeasure || prod.unit },
      batch: batchInfo,
      type: isEntry ? 'IN_ADJUSTMENT' : 'OUT_LOSS',
      quantity: adjustQty,
      previousStock: prev,
      currentStock: cur,
      newStock: cur,
      unitCost: prod.costPrice,
      totalCost: adjustQty * prod.costPrice,
      documentNumber,
      referenceType: 'MANUAL',
      reason: adjustReason,
      createdAt: new Date().toISOString(),
      createdByUser: { name: erpStore.user.name },
    });

    setProducts([...erpStore.products]);
    setSelectedProductForAdjustment(null);
    setSuccessMessage(`Movimentação [${movementCode}] do item "${prod.name}" gravada com sucesso no motor auditável!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
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
          <CheckCircle2 size={15} color="var(--color-success-solid)" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Barra de Filtros */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px',
            }}
          >
            {[
              { id: 'ALL', label: 'Todos os Itens' },
              { id: 'PRODUCT', label: 'Produtos e Insumos' },
              { id: 'SERVICE', label: 'Serviços' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilterType(btn.id)}
                style={{
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: filterType === btn.id ? 600 : 500,
                  backgroundColor: filterType === btn.id ? 'var(--color-surface-selected)' : 'transparent',
                  color: filterType === btn.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: filterLowStock ? 'var(--color-warning-bg)' : 'var(--color-surface)',
              color: filterLowStock ? 'var(--color-warning-text)' : 'var(--color-text-secondary)',
              border: `1px solid ${filterLowStock ? 'var(--color-warning-border)' : 'var(--color-border-subtle)'}`,
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertTriangle size={13} color={filterLowStock ? 'var(--color-warning-solid)' : 'currentColor'} />
            <span>Alerta de Estoque Mínimo</span>
          </button>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
          Mostrando <strong>{filtered.length}</strong> de {products.length} itens cadastrados
        </div>
      </div>

      {/* Tabela Densa de Catálogo e Estoque */}
      <div className="table-container">
        <table className="table-dense">
          <thead>
            <tr>
              <th style={{ width: '95px' }}>SKU</th>
              <th>Descrição do Item</th>
              <th style={{ width: '90px' }}>Unidade</th>
              <th style={{ width: '130px' }}>Rastreabilidade</th>
              <th className="col-num" style={{ width: '110px' }}>Preço Venda</th>
              <th className="col-num" style={{ width: '110px' }}>Custo (CMP)</th>
              <th className="col-num" style={{ width: '125px' }}>Estoque Atual</th>
              <th className="col-num" style={{ width: '100px' }}>Est. Mín.</th>
              <th style={{ width: '90px' }}>NCM</th>
              <th style={{ width: '100px', textAlign: 'right' }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((prod: Product) => {
              const isPhysical = prod.type === 'PRODUCT';
              const isLow = isPhysical && prod.currentStock <= prod.minStock;
              const uom = prod.unitOfMeasure || prod.unit;

              return (
                <tr key={prod.id}>
                  <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    {prod.sku}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{prod.name}</div>
                    {prod.batches && prod.batches.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                        {prod.batches.map((b) => (
                          <span
                            key={b.id}
                            style={{
                              fontSize: '10.5px',
                              fontFamily: 'var(--font-mono)',
                              backgroundColor: 'var(--color-surface-subtle)',
                              border: '1px solid var(--color-border-subtle)',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              color: 'var(--color-text-secondary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Tag size={10} />
                            {b.batchCode}: {Number(b.quantity).toFixed(4)} {uom}
                            {b.expirationDate && ` (Val: ${b.expirationDate})`}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        backgroundColor: 'var(--color-surface-subtle)',
                        border: '1px solid var(--color-border-subtle)',
                        fontSize: '11px',
                        fontWeight: 600,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {uom}
                    </span>
                  </td>
                  <td>
                    {isPhysical ? (
                      prod.isBatchControlled ? (
                        <span
                          className="status-badge info"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Layers size={11} />
                          Lote & Validade
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Sem Lote</span>
                      )
                    ) : (
                      <span className="status-badge neutral">Serviço</span>
                    )}
                  </td>
                  <td className="col-num" style={{ fontWeight: 600 }}>
                    R$ {prod.salePrice.toFixed(2)}
                  </td>
                  <td className="col-num" style={{ color: 'var(--color-text-secondary)' }}>
                    R$ {prod.costPrice.toFixed(4)}
                  </td>
                  <td className="col-num">
                    {isPhysical ? (
                      <span
                        style={{
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          color: isLow ? 'var(--color-danger-solid)' : 'var(--color-text-primary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {isLow && <AlertTriangle size={12} color="var(--color-danger-solid)" />}
                        {Number(prod.currentStock).toFixed(4)} {uom}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-tertiary)' }}>-</span>
                    )}
                  </td>
                  <td className="col-num" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {isPhysical ? `${Number(prod.minStock).toFixed(4)} ${uom}` : '-'}
                  </td>
                  <td style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>
                    {prod.ncm || '-'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {isPhysical && (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleOpenAdjustment(prod)}
                        title="Movimentar estoque (Motor SAP)"
                      >
                        <SlidersHorizontal size={13} />
                        <span>Movimentar</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de Movimentação de Estoque e Motor SAP */}
      {selectedProductForAdjustment && (
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
              maxWidth: '520px',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-modal)',
              padding: '22px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
                  Movimentação de Estoque (Motor Auditável)
                </h3>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Controle rigoroso por Tipos de Movimento e rastreabilidade por lote
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedProductForAdjustment(null)}>
                ✕
              </button>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-surface-subtle)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
                fontSize: '12px',
                marginBottom: '16px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
              }}
            >
              <div><strong>Item:</strong> {selectedProductForAdjustment.name}</div>
              <div><strong>SKU:</strong> {selectedProductForAdjustment.sku}</div>
              <div>
                <strong>Saldo Geral:</strong>{' '}
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  {Number(selectedProductForAdjustment.currentStock).toFixed(4)} {selectedProductForAdjustment.unitOfMeasure || selectedProductForAdjustment.unit}
                </span>
              </div>
              <div>
                <strong>Controle de Lote:</strong>{' '}
                {selectedProductForAdjustment.isBatchControlled ? (
                  <span style={{ color: 'var(--color-info-solid)', fontWeight: 600 }}>Sim (Exige Lote)</span>
                ) : (
                  <span>Não</span>
                )}
              </div>
            </div>

            <form onSubmit={handleConfirmAdjustment}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Tipo de Movimento Padronizado (SAP)
                </label>
                <select
                  value={movementCode}
                  onChange={(e) => setMovementCode(e.target.value)}
                  style={{ width: '100%', fontSize: '12.5px' }}
                >
                  <option value="101">101 - Entrada por Compra/Fornecedor (+)</option>
                  <option value="201">201 - Consumo por Produção/Uso Interno (-)</option>
                  <option value="202">202 - Estorno de Consumo por Produção (+)</option>
                  <option value="301">301 - Transferência entre Centros/Locais</option>
                  <option value="501">501 - Baixa por Perda / Avaria / Validade (-)</option>
                  <option value="502">502 - Estorno de Baixa por Perda (+)</option>
                </select>
              </div>

              {selectedProductForAdjustment.isBatchControlled && selectedProductForAdjustment.batches && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Lote e Validade
                  </label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    style={{ width: '100%', fontSize: '12.5px' }}
                  >
                    {selectedProductForAdjustment.batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.batchCode} - Saldo: {Number(b.quantity).toFixed(4)} (Val: {b.expirationDate || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Quantidade (Precisão Decimal)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    required
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', fontWeight: 600, fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Número do Documento / Ordem
                  </label>
                  <input
                    type="text"
                    required
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="Ex: OP-2026-001, NF-1240"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Justificativa Operacional (Obrigatória para perdas 501 / estornos 202, 502)
                </label>
                <input
                  type="text"
                  required={['501', '502', '202'].includes(movementCode)}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ex: Filamento úmido / insumo quebrado no setup"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedProductForAdjustment(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Movimentação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
