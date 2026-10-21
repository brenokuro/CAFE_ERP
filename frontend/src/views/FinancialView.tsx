// frontend/src/views/FinancialView.tsx
import React, { useState } from 'react';
import { CheckCircle, ArrowUpRight, ArrowDownLeft, Landmark } from 'lucide-react';
import { erpStore } from '../services/api';
import { FinancialRecord, FinancialRecordType } from '../types/erp.types';

export const FinancialView: React.FC = () => {
  const [activeType, setActiveType] = useState<FinancialRecordType>('RECEIVABLE');
  const [records, setRecords] = useState<FinancialRecord[]>([...erpStore.financialRecords]);
  const [cashFlow, setCashFlow] = useState(erpStore.getCashFlowSummary());
  const [selectedRecordToSettle, setSelectedRecordToSettle] = useState<FinancialRecord | null>(null);

  // Form de Liquidação
  const [settleBankId, setSettleBankId] = useState(erpStore.bankAccounts[0]?.id || '');
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleDate, setSettleDate] = useState(new Date().toISOString().split('T')[0]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredRecords = records.filter((r) => r.type === activeType);

  const handleOpenSettleModal = (record: FinancialRecord) => {
    setSelectedRecordToSettle(record);
    setSettleAmount(record.balanceAmount);
  };

  const handleConfirmSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordToSettle) return;

    try {
      erpStore.settleRecord(selectedRecordToSettle.id, settleBankId, settleAmount);
      setRecords([...erpStore.financialRecords]);
      setCashFlow(erpStore.getCashFlowSummary());
      setSelectedRecordToSettle(null);
      setSuccessMessage('Título liquidado com sucesso! Saldo bancário atualizado em tempo real.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 1. MENSAGEM DE SUCESSO */}
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

      {/* 2. CONSOLIDAÇÃO DO FLUXO DE CAIXA (RESUMO SÓBRIO SEM ELEMENTOS DECORATIVOS EXCESSIVOS) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {/* Saldo Disponível Real */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
            Disponível em Bancos & Caixa
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>
            R$ {cashFlow.summary.currentAvailableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            Saldo consolidado em {cashFlow.bankAccounts.length} contas ativas
          </div>
        </div>

        {/* Total a Receber */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-success-text)', textTransform: 'uppercase' }}>
            Total a Receber (Projetado)
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-success-solid)', marginTop: '4px' }}>
            + R$ {cashFlow.summary.totalProjectedReceivables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            Entradas previstas de vendas a prazo
          </div>
        </div>

        {/* Total a Pagar */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-danger-text)', textTransform: 'uppercase' }}>
            Total a Pagar (Projetado)
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-danger-solid)', marginTop: '4px' }}>
            - R$ {cashFlow.summary.totalProjectedPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            Compromissos e compras de fornecedores
          </div>
        </div>

        {/* Saldo Final Projetado */}
        <div
          style={{
            backgroundColor: 'var(--color-surface-subtle)',
            border: '1px solid var(--color-primary-200)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary-700)', textTransform: 'uppercase' }}>
            Saldo Final Projetado
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-primary-600)', marginTop: '4px' }}>
            R$ {cashFlow.summary.finalProjectedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Fluxo líquido projetado: R$ {cashFlow.summary.netProjectedFlow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* 3. VISÃO RÁPIDA DAS CONTAS BANCÁRIAS */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '16px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}
      >
        {erpStore.bankAccounts.map((acc) => (
          <div
            key={acc.id}
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              minWidth: '220px',
            }}
          >
            <Landmark size={16} color="var(--color-text-secondary)" />
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{acc.name}</div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-primary-600)' }}>
                R$ {acc.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. BARRA DE CONTROLE: ABAS CONTAS A RECEBER X CONTAS A PAGAR */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
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
            onClick={() => setActiveType('RECEIVABLE')}
            style={{
              height: '28px',
              padding: '0 12px',
              fontSize: '12px',
              fontWeight: activeType === 'RECEIVABLE' ? 600 : 500,
              color: activeType === 'RECEIVABLE' ? 'var(--color-success-text)' : 'var(--color-text-secondary)',
              backgroundColor: activeType === 'RECEIVABLE' ? 'var(--color-success-bg)' : 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-xs)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowUpRight size={14} color="var(--color-success-solid)" />
            <span>Contas a Receber ({records.filter((r) => r.type === 'RECEIVABLE').length})</span>
          </button>
          <button
            onClick={() => setActiveType('PAYABLE')}
            style={{
              height: '28px',
              padding: '0 12px',
              fontSize: '12px',
              fontWeight: activeType === 'PAYABLE' ? 600 : 500,
              color: activeType === 'PAYABLE' ? 'var(--color-danger-text)' : 'var(--color-text-secondary)',
              backgroundColor: activeType === 'PAYABLE' ? 'var(--color-danger-bg)' : 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-xs)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowDownLeft size={14} color="var(--color-danger-solid)" />
            <span>Contas a Pagar ({records.filter((r) => r.type === 'PAYABLE').length})</span>
          </button>
        </div>
      </div>

      {/* 5. TABELA DE TÍTULOS FINANCEIROS */}
      <div className="table-container">
        <table className="table-dense">
          <thead>
            <tr>
              <th style={{ width: '100px' }}>Vencimento</th>
              <th>Descrição do Lançamento</th>
              <th>Contato / Pessoa</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Parcela</th>
              <th className="col-num" style={{ width: '110px' }}>Valor Original</th>
              <th className="col-num" style={{ width: '110px' }}>Valor Pago</th>
              <th className="col-num" style={{ width: '110px' }}>Saldo Aberto</th>
              <th style={{ width: '100px' }}>Status</th>
              <th style={{ width: '100px', textAlign: 'right' }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-tertiary)' }}>
                  Nenhum título encontrado nesta categoria.
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec) => {
                const isPaid = rec.status === 'PAID';
                return (
                  <tr key={rec.id}>
                    <td style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {rec.dueDate}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{rec.description}</div>
                      {rec.salesOrderId && (
                        <div style={{ fontSize: '10.5px', color: 'var(--color-text-tertiary)' }}>
                          Venda Vinculada: #{rec.salesOrderId}
                        </div>
                      )}
                    </td>
                    <td>{rec.contact?.name || 'Geral'}</td>
                    <td style={{ textAlign: 'center', fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>
                      {rec.installmentNumber}/{rec.totalInstallments}
                    </td>
                    <td className="col-num">
                      R$ {rec.originalAmount.toFixed(2)}
                    </td>
                    <td className="col-num" style={{ color: 'var(--color-text-secondary)' }}>
                      R$ {rec.paidAmount.toFixed(2)}
                    </td>
                    <td className="col-num" style={{ fontWeight: 600 }}>
                      R$ {rec.balanceAmount.toFixed(2)}
                    </td>
                    <td>
                      <span className={`status-badge ${isPaid ? 'success' : rec.status === 'PENDING' ? 'warning' : 'info'}`}>
                        <span className={`status-dot ${isPaid ? 'success' : rec.status === 'PENDING' ? 'warning' : 'info'}`} />
                        {isPaid ? 'Quitado' : rec.status === 'PENDING' ? 'Aberto' : rec.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {!isPaid && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleOpenSettleModal(rec)}
                          title="Dar baixa / liquidar título"
                        >
                          <CheckCircle size={13} />
                          <span>Baixar</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 6. MODAL DE BAIXA / LIQUIDAÇÃO DE TÍTULO */}
      {selectedRecordToSettle && (
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
              maxWidth: '460px',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-modal)',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
                Liquidação de {selectedRecordToSettle.type === 'RECEIVABLE' ? 'Recebimento' : 'Pagamento'}
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedRecordToSettle(null)}>
                ✕
              </button>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-surface-subtle)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
                fontSize: '12px',
                marginBottom: '14px',
              }}
            >
              <div><strong>Título:</strong> {selectedRecordToSettle.description}</div>
              <div><strong>Saldo Aberto:</strong> R$ {selectedRecordToSettle.balanceAmount.toFixed(2)}</div>
            </div>

            <form onSubmit={handleConfirmSettle}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Conta Bancária / Caixa
                </label>
                <select
                  value={settleBankId}
                  onChange={(e) => setSettleBankId(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {erpStore.bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (Saldo: R$ {b.currentBalance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Data do Pagamento
                  </label>
                  <input
                    type="date"
                    value={settleDate}
                    onChange={(e) => setSettleDate(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Valor a Liquidar (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    max={selectedRecordToSettle.balanceAmount}
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(Number(e.target.value))}
                    style={{ width: '100%', fontWeight: 600 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedRecordToSettle(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
