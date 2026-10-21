// frontend/src/views/SalesView.tsx
import React, { useState } from 'react';
import { Plus, CheckCircle, Eye, AlertCircle, Trash2 } from 'lucide-react';
import { erpStore } from '../services/api';
import { SalesOrder, Contact, Product } from '../types/erp.types';

export const SalesView: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([...erpStore.salesOrders]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<SalesOrder | null>(null);

  // Estados do formulário de novo pedido
  const [selectedCustomerId, setSelectedCustomerId] = useState(erpStore.contacts[0]?.id || '');
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([
    { productId: erpStore.products[0]?.id || '', quantity: 1, unitPrice: erpStore.products[0]?.salePrice || 0 },
  ]);
  const [installmentsCount, setInstallmentsCount] = useState(1);
  const [approveNow, setApproveNow] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filtragem
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchesSearch =
      searchTerm === '' ||
      o.orderNumber.toString().includes(searchTerm) ||
      (o.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesStatus && matchesSearch;
  });

  // Atualização de item no form
  const handleItemProductChange = (index: number, productId: string) => {
    const prod = erpStore.products.find((p: Product) => p.id === productId);
    const updated = [...orderItems];
    updated[index].productId = productId;
    if (prod) {
      updated[index].unitPrice = prod.salePrice;
    }
    setOrderItems(updated);
  };

  const handleItemQuantityChange = (index: number, quantity: number) => {
    const updated = [...orderItems];
    updated[index].quantity = Math.max(1, quantity);
    setOrderItems(updated);
  };

  const handleAddItem = () => {
    const firstProd = erpStore.products[0];
    setOrderItems([
      ...orderItems,
      { productId: firstProd?.id || '', quantity: 1, unitPrice: firstProd?.salePrice || 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const calculatedTotal = orderItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const newOrder = erpStore.createSalesOrder({
        customerId: selectedCustomerId,
        items: orderItems,
        approveNow,
        installmentsCount,
      });

      setOrders([...erpStore.salesOrders]);
      setIsModalOpen(false);
      setSuccessMessage(
        approveNow
          ? `Venda #${newOrder.orderNumber} emitida com sucesso! Estoque baixado e Contas a Receber gerado.`
          : `Orçamento #${newOrder.orderNumber} salvo como rascunho.`,
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar venda.');
    }
  };

  const handleInvoiceExisting = (orderId: string) => {
    try {
      erpStore.invoiceSalesOrder(orderId, 1);
      setOrders([...erpStore.salesOrders]);
      setSuccessMessage('Venda faturada com sucesso! Baixa de estoque e títulos gerados.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 1. MENSAGEM DE SUCESSO / NOTIFICAÇÃO DISCRETA */}
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

      {/* 2. BARRA DE FERRAMENTAS */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
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
              { id: 'ALL', label: 'Todos' },
              { id: 'INVOICED', label: 'Faturados' },
              { id: 'DRAFT', label: 'Rascunhos' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setStatusFilter(btn.id)}
                style={{
                  height: '26px',
                  padding: '0 10px',
                  fontSize: '12px',
                  fontWeight: statusFilter === btn.id ? 600 : 500,
                  color: statusFilter === btn.id ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                  backgroundColor: statusFilter === btn.id ? 'var(--color-primary-50)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-xs)',
                  cursor: 'pointer',
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Filtrar por nº ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '220px', height: '30px', fontSize: '12px' }}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setErrorMessage(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={15} />
          <span>Nova Venda</span>
        </button>
      </div>

      {/* 3. TABELA DE ALTA DENSIDADE DE VENDAS */}
      <div className="table-container">
        <table className="table-dense">
          <thead>
            <tr>
              <th style={{ width: '90px' }}>Nº Pedido</th>
              <th style={{ width: '100px' }}>Data</th>
              <th>Cliente / Razão Social</th>
              <th>Itens / Resumo</th>
              <th className="col-num" style={{ width: '120px' }}>Total Líquido</th>
              <th style={{ width: '110px' }}>Status</th>
              <th style={{ width: '130px', textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-tertiary)' }}>
                  Nenhum pedido de venda encontrado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const isDraft = order.status === 'DRAFT';
                return (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600, color: 'var(--color-primary-600)' }}>
                      #{order.orderNumber}
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>
                      {order.issueDate}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{order.customer?.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                        {order.customer?.document}
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>
                      {order.items.map((i: any) => `${i.quantity}x ${i.product?.sku}`).join(', ')}
                    </td>
                    <td className="col-num" style={{ fontWeight: 600 }}>
                      R$ {order.totalNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`status-badge ${order.status === 'INVOICED' ? 'success' : order.status === 'DRAFT' ? 'warning' : 'danger'}`}>
                        <span className={`status-dot ${order.status === 'INVOICED' ? 'success' : order.status === 'DRAFT' ? 'warning' : 'danger'}`} />
                        {order.status === 'INVOICED' ? 'Faturado' : order.status === 'DRAFT' ? 'Rascunho' : order.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px', justifyContent: 'flex-end' }}>
                        {isDraft && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleInvoiceExisting(order.id)}
                            title="Faturar imediatamente (baixa estoque e gera contas a receber)"
                          >
                            <CheckCircle size={13} />
                            <span>Faturar</span>
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setSelectedOrderDetails(order)}
                          title="Visualizar detalhes"
                        >
                          <Eye size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. MODAL: NOVA VENDA */}
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
                <h2 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Novo Pedido de Venda</h2>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  Gera faturamento com validação atômica de estoque e Contas a Receber
                </span>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setIsModalOpen(false)}
                style={{ fontSize: '16px', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} style={{ padding: '18px', overflowY: 'auto' }}>
              {errorMessage && (
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-danger-bg)',
                    border: '1px solid var(--color-danger-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-danger-text)',
                    fontSize: '12px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <AlertCircle size={15} color="var(--color-danger-solid)" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Cliente / Destinatário
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {erpStore.contacts
                    .filter((c: Contact) => c.role === 'CUSTOMER' || c.role === 'BOTH')
                    .map((c: Contact) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.document ? `(${c.document})` : ''}
                      </option>
                    ))}
                </select>
              </div>

              {/* Tabela de Itens */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    Itens da Venda
                  </label>
                  <button type="button" onClick={handleAddItem} className="btn btn-secondary btn-sm">
                    <Plus size={13} />
                    <span>Adicionar Item</span>
                  </button>
                </div>

                <div className="table-container">
                  <table className="table-dense">
                    <thead>
                      <tr>
                        <th>Produto</th>
                        <th style={{ width: '80px' }}>Qtd</th>
                        <th className="col-num" style={{ width: '110px' }}>Preço Un.</th>
                        <th className="col-num" style={{ width: '110px' }}>Subtotal</th>
                        <th style={{ width: '36px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item, idx) => {
                        const product = erpStore.products.find((p: Product) => p.id === item.productId);
                        const subtotal = item.quantity * item.unitPrice;
                        const hasStockIssue = product && product.type === 'PRODUCT' && product.currentStock < item.quantity;

                        return (
                          <tr key={idx}>
                            <td>
                              <select
                                value={item.productId}
                                onChange={(e) => handleItemProductChange(idx, e.target.value)}
                                style={{ width: '100%', height: '28px', fontSize: '12px' }}
                              >
                                {erpStore.products.map((p: Product) => (
                                  <option key={p.id} value={p.id}>
                                    {p.sku} - {p.name} (Estoque: {p.currentStock} {p.unit})
                                  </option>
                                ))}
                              </select>
                              {hasStockIssue && (
                                <div style={{ fontSize: '10px', color: 'var(--color-danger-solid)', fontWeight: 600, marginTop: '2px' }}>
                                  ⚠️ Saldo insuficiente ({product.currentStock} disponíveis)
                                </div>
                              )}
                            </td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleItemQuantityChange(idx, Number(e.target.value))}
                                style={{ width: '100%', height: '28px', textAlign: 'center' }}
                              />
                            </td>
                            <td className="col-num">
                              <span style={{ fontSize: '12px' }}>
                                R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="col-num" style={{ fontWeight: 600, fontSize: '12px' }}>
                              R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '2px', color: 'var(--color-text-tertiary)' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Parcelamento e Faturamento */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  backgroundColor: 'var(--color-surface-subtle)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-subtle)',
                  marginBottom: '14px',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Condição de Pagamento / Parcelas
                  </label>
                  <select
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                    style={{ width: '100%', height: '28px', fontSize: '12px' }}
                  >
                    <option value={1}>1x À Vista (30 dias) - R$ {calculatedTotal.toFixed(2)}</option>
                    <option value={2}>2x Sem Juros - 2x R$ {(calculatedTotal / 2).toFixed(2)}</option>
                    <option value={3}>3x Sem Juros - 3x R$ {(calculatedTotal / 3).toFixed(2)}</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={approveNow}
                      onChange={(e) => setApproveNow(e.target.checked)}
                      style={{ width: '15px', height: '15px', accentColor: 'var(--color-primary-600)' }}
                    />
                    <span>Faturar imediatamente (Baixar Estoque + Gerar Receber)</span>
                  </label>
                  <span style={{ fontSize: '10.5px', color: 'var(--color-text-tertiary)', marginLeft: '23px' }}>
                    Desmarque para salvar apenas como Orçamento/Rascunho.
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'baseline',
                  gap: '12px',
                  marginBottom: '16px',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--color-border-subtle)',
                }}
              >
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Total Líquido da Venda:</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary-600)' }}>
                  R$ {calculatedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {approveNow ? 'Confirmar e Faturar Venda' : 'Salvar como Orçamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL DE DETALHES */}
      {selectedOrderDetails && (
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
              maxWidth: '560px',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-modal)',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
                Detalhes da Venda #{selectedOrderDetails.orderNumber}
              </h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedOrderDetails(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '12.5px', marginBottom: '12px' }}>
              <strong>Cliente:</strong> {selectedOrderDetails.customer?.name} ({selectedOrderDetails.customer?.document})
            </div>

            <div style={{ fontSize: '12.5px', marginBottom: '12px' }}>
              <strong>Data de Emissão:</strong> {selectedOrderDetails.issueDate}
            </div>

            <div className="table-container" style={{ marginBottom: '14px' }}>
              <table className="table-dense">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="col-num">Qtd</th>
                    <th className="col-num">Preço</th>
                    <th className="col-num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrderDetails.items.map((it: any, idx: number) => (
                    <tr key={idx}>
                      <td>{it.product?.name || it.product?.sku}</td>
                      <td className="col-num">{it.quantity}</td>
                      <td className="col-num">R$ {it.unitPrice.toFixed(2)}</td>
                      <td className="col-num" style={{ fontWeight: 600 }}>R$ {it.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '15px', color: 'var(--color-primary-600)', marginBottom: '16px' }}>
              Total: R$ {selectedOrderDetails.totalNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedOrderDetails(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
