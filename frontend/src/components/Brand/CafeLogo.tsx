// frontend/src/components/Brand/CafeLogo.tsx
import React from 'react';

interface CafeLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
  showBadge?: boolean;
}

export const CafeLogo: React.FC<CafeLogoProps> = ({
  size = 'md',
  variant = 'dark',
  showBadge = true,
}) => {
  const isLight = variant === 'light';

  // Dimensões compactas e proporcionais
  const dimensions = {
    sm: { markSize: 22, fontSize: 13, markFont: 11, badgeFont: 9 },
    md: { markSize: 26, fontSize: 15, markFont: 13, badgeFont: 10 },
    lg: { markSize: 34, fontSize: 20, markFont: 17, badgeFont: 11 },
  }[size];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'lg' ? '10px' : '8px',
        userSelect: 'none',
      }}
    >
      {/* Monograma geométrico sóbrio [ C ] */}
      <div
        style={{
          width: dimensions.markSize,
          height: dimensions.markSize,
          backgroundColor: isLight ? '#ffffff' : '#111827',
          color: isLight ? '#111827' : '#ffffff',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontFamily: 'var(--font-sans)',
          fontSize: dimensions.markFont,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          border: isLight ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)',
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        C
      </div>

      {/* Logotipo Tipográfico CAFE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: dimensions.fontSize,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: isLight ? '#ffffff' : '#111827',
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          CAFE
        </span>

        {showBadge && (
          <span
            style={{
              fontSize: dimensions.badgeFont,
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: isLight ? 'rgba(255,255,255,0.7)' : 'var(--color-text-secondary)',
              backgroundColor: isLight ? 'rgba(255,255,255,0.1)' : 'var(--color-canvas)',
              border: `1px solid ${isLight ? 'rgba(255,255,255,0.15)' : 'var(--color-border-subtle)'}`,
              padding: '1px 4px',
              borderRadius: '2px',
              lineHeight: 1.2,
            }}
          >
            ERP
          </span>
        )}
      </div>
    </div>
  );
};
