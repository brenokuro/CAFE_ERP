// frontend/src/views/ContactsView.tsx
import React, { useState } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import { erpStore } from '../services/api';
import { Contact, ContactRole, PersonType } from '../types/erp.types';

export const ContactsView: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([...erpStore.contacts]);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form novo contato
  const [name, setName] = useState('');
  const [role, setRole] = useState<ContactRole>('CUSTOMER');
  const [personType, setPersonType] = useState<PersonType>('LEGAL_ENTITY');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [creditLimit, setCreditLimit] = useState(15000);

  const filtered = contacts.filter((c) => {
    if (roleFilter === 'ALL') return true;
    return c.role === roleFilter || c.role === 'BOTH';
  });

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    const newContact: Contact = {
      id: `c-${Date.now()}`,
      name,
      role,
      personType,
      document,
      email,
      phone,
      city,
      state,
      creditLimit,
      active: true,
    };

    erpStore.contacts.unshift(newContact);
    setContacts([...erpStore.contacts]);
    setIsModalOpen(false);
    setSuccessMessage(`Contato "${name}" cadastrado com sucesso!`);
    setTimeout(() => setSuccessMessage(null), 4000);

    // Reset form
    setName('');
    setDocument('');
    setEmail('');
    setPhone('');
    setCity('');
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
            { id: 'ALL', label: 'Todos os Contatos' },
            { id: 'CUSTOMER', label: 'Clientes' },
            { id: 'SUPPLIER', label: 'Fornecedores' },
            { id: 'BOTH', label: 'Ambos' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setRoleFilter(btn.id)}
              style={{
                height: '26px',
                padding: '0 10px',
                fontSize: '12px',
                fontWeight: roleFilter === btn.id ? 600 : 500,
                color: roleFilter === btn.id ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                backgroundColor: roleFilter === btn.id ? 'var(--color-primary-50)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={15} />
          <span>Novo Contato</span>
        </button>
      </div>

      {/* Tabela Densa de Contatos */}
      <div className="table-container">
        <table className="table-dense">
          <thead>
            <tr>
              <th>Razão Social / Nome Completo</th>
              <th style={{ width: '130px' }}>Papel</th>
              <th style={{ width: '140px' }}>Documento</th>
              <th>E-mail</th>
              <th style={{ width: '130px' }}>Telefone</th>
              <th style={{ width: '120px' }}>Cidade / UF</th>
              <th className="col-num" style={{ width: '110px' }}>Limite Crédito</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((contact) => (
              <tr key={contact.id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{contact.name}</div>
                  {contact.tradeName && (
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{contact.tradeName}</div>
                  )}
                </td>
                <td>
                  <span
                    className={`status-badge ${
                      contact.role === 'CUSTOMER' ? 'info' : contact.role === 'SUPPLIER' ? 'warning' : 'success'
                    }`}
                  >
                    {contact.role === 'CUSTOMER' ? 'Cliente' : contact.role === 'SUPPLIER' ? 'Fornecedor' : 'Cliente & Forn.'}
                  </span>
                </td>
                <td style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {contact.document || '-'}
                </td>
                <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {contact.email || '-'}
                </td>
                <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {contact.phone || '-'}
                </td>
                <td style={{ fontSize: '12px' }}>
                  {contact.city ? `${contact.city}/${contact.state}` : '-'}
                </td>
                <td className="col-num" style={{ fontWeight: 600 }}>
                  {contact.creditLimit ? `R$ ${contact.creditLimit.toLocaleString('pt-BR')}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Novo Contato */}
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
              maxWidth: '520px',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-modal)',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Cadastrar Pessoa / Contato</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateContact}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Papel no ERP
                  </label>
                  <select value={role} onChange={(e) => setRole(e.target.value as any)} style={{ width: '100%' }}>
                    <option value="CUSTOMER">Cliente</option>
                    <option value="SUPPLIER">Fornecedor</option>
                    <option value="BOTH">Ambos (Cliente & Fornecedor)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Tipo de Pessoa
                  </label>
                  <select value={personType} onChange={(e) => setPersonType(e.target.value as any)} style={{ width: '100%' }}>
                    <option value="LEGAL_ENTITY">Pessoa Jurídica (CNPJ)</option>
                    <option value="INDIVIDUAL">Pessoa Física (CPF)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Razão Social / Nome Completo
                </label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    CNPJ ou CPF
                  </label>
                  <input type="text" value={document} onChange={(e) => setDocument(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Limite de Crédito (R$)
                  </label>
                  <input type="number" value={creditLimit} onChange={(e) => setCreditLimit(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Cidade
                  </label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    UF
                  </label>
                  <input type="text" maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Contato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
