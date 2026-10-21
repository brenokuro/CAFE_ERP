// frontend/src/views/ReconciliationView.tsx
import React, { useState } from 'react';
import { ArrowLeftRight, CheckCircle2, AlertCircle, Landmark } from 'lucide-react';
import { erpStore } from '../services/api';
import { BankTransaction, FinancialRecord } from '../types/erp.types';

export const ReconciliationView: React.FC = () => {
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([...erpStore.bankTransactions]);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([...erpStore.financialRecords]);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(
    bankTransactions.find((t) => !t.reconciled)?.id || null,
  );
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedTx = bankTransactions.find((t) => t.id === selectedTxId);

  const compatibleRecords = financialRecords.filter((r) => {
    if (r.status === 'PAID') return false;
    if (!selectedTx) return true;
    if (selectedTx.type === 'CREDIT') return r.type === 'RECEIVABLE';
    if (selectedTx.type === 'DEBIT') return r.type === 'PAYABLE';
    return true;
  });

  const handleReconcile = () => {
    if (!selectedTxId || !selectedRecordId) {
      setErrorMessage('Selecione uma transação bancária e um título correspondente para conciliar.');
      return;
    }

    try {
      erpStore.reconcile(selectedTxId, selectedRecordId);
      setBankTransactions([...erpStore.bankTransactions]);
      setFinancialRecords([...erpStore.financialRecords]);
      setSelectedRecordId(null);
      setErrorMessage(null);
      setSuccessMessage('Transação e Título conciliados com sucesso! Status e saldo bancário atualizados.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 1. MENSAGENS DE FEEDBACK */}
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

      {errorMessage && (
        <div
          style={{
            marginBottom: '16px',
            padding: '10px 14px',
            backgroundColor: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-danger-text)',
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={15} color="var(--color-danger-solid)" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. CABEÇALHO DO MÓDULO */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Mesa de Conciliação Bancária</h2>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Vincule extratos de PIX, TED e cartões diretamente aos títulos operacionais do CAFE ERP
          </span>
        </div>

        {/* Botão de Ação de Conciliação */}
        <button
          className="btn btn-primary"
          disabled={!selectedTxId || !selectedRecordId}
          onClick={handleReconcile}
        >
          <ArrowLeftRight size={14} />
          <span>Confirmar Conciliação</span>
        </button>
      </div>

      {/* 3. LAYOUT DUAS COLUNAS LADO A LADO */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
        }}
      >
        {/* Painel Esquerdo: Extrato Bancário */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--color-border-subtle)',
              backgroundColor: 'var(--color-surface-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Landmark size={15} color="var(--color-text-secondary)" />
              <span style={{ fontSize: '12.5px', fontWeight: 600 }}>Extrato Bancário (Transações)</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
              {bankTransactions.filter((t) => !t.reconciled).length} pendentes
            </span>
          </div>

          <div style={{ maxHeight: '550px', overflowY: 'auto' }}>
            <table className="table-dense">
              <thead>
                <tr>
                  <th style={{ width: '85px' }}>Data</th>
                  <th>Descrição no Extrato</th>
                  <th className="col-num" style={{ width: '100px' }}>Valor</th>
                  <th style={{ width: '90px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {bankTransactions.map((tx) => {
                  const isSelected = selectedTxId === tx.id;
                  const isCredit = tx.type === 'CREDIT';

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => !tx.reconciled && setSelectedTxId(tx.id)}
                      style={{
                        cursor: tx.reconciled ? 'default' : 'pointer',
                        backgroundColor: isSelected ? 'var(--color-primary-50)' : undefined,
                        opacity: tx.reconciled ? 0.6 : 1,
                      }}
                    >
                      <td style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>
                        {tx.transactionDate}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: '12px' }}>{tx.description}</div>
                        {tx.externalReferenceId && (
                          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                            Ref: {tx.externalReferenceId}
                          </div>
                        )}
                      </td>
                      <td
                        className="col-num"
                        style={{
                          fontWeight: 600,
                          color: isCredit ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                        }}
                      >
                        {isCredit ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                      </td>
                      <td>
                        <span className={`status-badge ${tx.reconciled ? 'success' : 'warning'}`}>
                          {tx.reconciled ? 'Conciliado' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Painel Direito: Títulos no ERP em Aberto */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--color-border-subtle)',
              backgroundColor: 'var(--color-surface-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '12.5px', fontWeight: 600 }}>
              Títulos no ERP {selectedTx ? `(Compatíveis com ${selectedTx.type === 'CREDIT' ? 'Entrada' : 'Saída'})` : ''}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
              {compatibleRecords.length} títulos abertos
            </span>
          </div>

          <div style={{ maxHeight: '550px', overflowY: 'auto' }}>
            <table className="table-dense">
              <thead>
                <tr>
                  <th style={{ width: '85px' }}>Vencimento</th>
                  <th>Título / Contato</th>
                  <th className="col-num" style={{ width: '100px' }}>Saldo</th>
                  <th style={{ width: '70px', textAlign: 'center' }}>Vincular</th>
                </tr>
              </thead>
              <tbody>
                {compatibleRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-tertiary)' }}>
                      Nenhum título em aberto correspondente.
                    </td>
                  </tr>
                ) : (
                  compatibleRecords.map((rec) => {
                    const isSelected = selectedRecordId === rec.id;

                    return (
                      <tr
                        key={rec.id}
                        onClick={() => setSelectedRecordId(rec.id)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'var(--color-primary-50)' : undefined,
                        }}
                      >
                        <td style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>
                          {rec.dueDate}
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: '12px' }}>{rec.description}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                            {rec.contact?.name}
                          </div>
                        </td>
                        <td className="col-num" style={{ fontWeight: 600 }}>
                          R$ {rec.balanceAmount.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="radio"
                            name="selectedRecord"
                            checked={isSelected}
                            onChange={() => setSelectedRecordId(rec.id)}
                            style={{ accentColor: 'var(--color-primary-600)', cursor: 'pointer' }}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
