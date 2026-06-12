import type { ReactNode } from 'react';

// Storybook-only helper (not exported from the package): renders the same
// children twice, once per density, so reviewers see compact (web-ops) and
// comfortable (pvz) side by side. Each column is its own `data-density` root,
// so the density bridge in styles.css resolves independently per column.
export function DensityPair({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-12)', flexWrap: 'wrap' }}>
      {(['compact', 'comfortable'] as const).map((density) => (
        <div key={density} data-density={density} style={{ minWidth: 240 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--cui-text-muted)',
              marginBottom: 'var(--space-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {density}
          </div>
          {children}
        </div>
      ))}
    </div>
  );
}
