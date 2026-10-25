// frontend/src/views/LoginView.tsx
import React, { useState } from 'react';
import { CafeLogo } from '../components/Brand/CafeLogo';
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';
import { login } from '../services/auth';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      onLoginSuccess();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Falha ao entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--color-canvas)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}
      >
        {/* Topo com a marca oficial CAFE */}
        <div
          style={{
            padding: '28px 24px 20px 24px',
            borderBottom: '1px solid var(--color-border-subtle)',
            backgroundColor: 'var(--color-surface-subtle)',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'inline-block', marginBottom: '8px' }}>
            <CafeLogo size="lg" />
          </div>
          <p
            style={{
              fontSize: '12.5px',
              color: 'var(--color-text-secondary)',
              margin: 0,
            }}
          >
            Autenticação Empresarial Unificada
          </p>
        </div>

        {/* Formulário de Login */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Empresa / Tenant */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
              }}
            >
              Acesso à empresa
            </label>
            <input
              type="text"
              value="A empresa será identificada pela sua conta"
              disabled
              style={{
                width: '100%',
                backgroundColor: 'var(--color-canvas)',
                fontSize: '12px',
                fontWeight: 500,
              }}
            />
          </div>

          {error && <p role="alert" style={{ color: 'var(--color-danger-solid)', fontSize: '12px', margin: '0 0 14px' }}>{error}</p>}

          {/* E-mail */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
              }}
            >
              E-mail Corporativo
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={14}
                color="var(--color-text-tertiary)"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', paddingLeft: '32px' }}
              />
            </div>
          </div>

          {/* Senha */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                }}
              >
                Senha de Acesso
              </label>
              <a href="#recuperar" style={{ fontSize: '11.5px', color: 'var(--color-primary-600)' }}>
                Esqueceu?
              </a>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock
                size={14}
                color="var(--color-text-tertiary)"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '32px' }}
              />
            </div>
          </div>

          {/* Botão de Entrar */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', height: '36px', fontSize: '13.5px', fontWeight: 600 }}
          >
            {loading ? 'Validando...' : 'Acessar CAFE ERP'}
            <ArrowRight size={15} />
          </button>

          {/* Rodapé discreto de segurança */}
          <div
            style={{
              marginTop: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '11px',
              color: 'var(--color-text-tertiary)',
            }}
          >
            <ShieldCheck size={14} color="var(--color-success-solid)" />
            <span>Sessão segura com isolamento multi-tenant</span>
          </div>
        </form>
      </div>

      <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
        CAFE ERP • Sistema de Gestão Empresarial v1.0
      </div>
    </div>
  );
};
