import type { ReactNode } from 'react';
import {
  color,
  badgeStatus,
  badgeClaim,
  typeScale,
  space,
  radius,
  shadow,
  fontFamily,
} from '@cargo/tokens';

// Token showcase for Web Operations. This is NOT product UI — no Button/Badge/Card
// components (that is step 3). Everything here reads values straight from
// @cargo/tokens and renders them with inline styles so the swatches/badges show the
// exact token value, plus a few Tailwind utility classes (generated from the same
// tokens via theme.css) for layout/typography.

const SCALES: Array<[string, Record<string, string>]> = [
  ['accent', color.accent],
  ['neutral', color.neutral],
  ['success', color.success],
  ['warning', color.warning],
  ['danger', color.danger],
  ['info', color.info],
];

// RU labels (TZ §3) — display only.
const STATUS_LABELS: Record<keyof typeof badgeStatus, string> = {
  AT_JP: 'На складе в Японии',
  PACKED: 'Упакована к отправке',
  SHIPPED: 'В пути',
  CUSTOMS: 'На таможне',
  AT_KG: 'Прибыла в Кыргызстан',
  DELIVERY: 'Передана в доставку/ПВЗ',
  DONE: 'Выдана',
  RETURNED: 'Возвращена',
  LOST: 'Утеряна',
  DISPOSED: 'Утилизирована',
};

const CLAIM_LABELS: Record<keyof typeof badgeClaim, string> = {
  UNCLAIMED: 'Не привязана',
  CLAIMED: 'Привязана к клиенту',
  DISPUTED: 'Спорная',
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-comfortable-lg font-semibold text-neutral-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function ColorScale({ name, steps }: { name: string; steps: Record<string, string> }) {
  return (
    <div className="mb-6">
      <h3 className="text-compact-sm font-semibold text-neutral-700 mb-2 font-mono uppercase">
        {name}
      </h3>
      <div className="flex flex-wrap gap-2">
        {Object.entries(steps).map(([step, hex]) => (
          <div key={step} className="w-20">
            <div
              className="h-14 w-full"
              style={{ backgroundColor: hex, borderRadius: radius.md }}
            />
            <div className="text-compact-xs font-mono text-neutral-600 mt-1">{step}</div>
            <div className="text-compact-xs font-mono text-neutral-500">{hex}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Badge({
  bg,
  text,
  border,
  code,
  label,
}: {
  bg: string;
  text: string;
  border?: string;
  code: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex items-center px-2 py-0.5 text-compact-xs font-semibold font-mono"
        style={{
          backgroundColor: bg,
          color: text,
          borderRadius: radius.full,
          border: border ? `1px solid ${border}` : undefined,
        }}
      >
        {code}
      </span>
      <span className="text-compact-sm text-neutral-600">{label}</span>
    </div>
  );
}

export default function App() {
  return (
    <main
      className="min-h-screen bg-neutral-50 text-neutral-900 p-8"
      style={{ fontFamily: fontFamily.sans }}
    >
      <header className="mb-12">
        <h1 className="text-comfortable-2xl font-bold text-accent-600">CARGO Design Tokens</h1>
        <p className="text-comfortable-md text-neutral-600 mt-2">
          Единый источник токенов для web-ops, pvz и mobile — пакет{' '}
          <code className="font-mono text-accent-700">@cargo/tokens</code>.
        </p>
      </header>

      <Section title="Цветовые шкалы (6)">
        {SCALES.map(([name, steps]) => (
          <ColorScale key={name} name={name} steps={steps} />
        ))}
      </Section>

      <Section title="Статусные бейджи">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-compact-sm font-semibold text-neutral-700 mb-3 font-mono">
              status (ось 1 — где посылка) · 10
            </h3>
            <div className="flex flex-col gap-2">
              {Object.entries(badgeStatus).map(([code, v]) => (
                <Badge
                  key={code}
                  code={code}
                  bg={v.bg}
                  text={v.text}
                  label={STATUS_LABELS[code as keyof typeof badgeStatus]}
                />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-compact-sm font-semibold text-neutral-700 mb-3 font-mono">
              claim_status (ось 2 — чья посылка) · 3
            </h3>
            <div className="flex flex-col gap-2">
              {Object.entries(badgeClaim).map(([code, v]) => (
                <Badge
                  key={code}
                  code={code}
                  bg={v.bg}
                  text={v.text}
                  border={'border' in v ? v.border : undefined}
                  label={CLAIM_LABELS[code as keyof typeof badgeClaim]}
                />
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Типографика — две шкалы плотности">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {(['compact', 'comfortable'] as const).map((density) => (
            <div key={density}>
              <h3 className="text-compact-sm font-semibold text-neutral-700 mb-3 font-mono">
                {density}
              </h3>
              <div className="flex flex-col gap-2">
                {Object.entries(typeScale[density]).map(([step, v]) => (
                  <div key={step} className="flex items-baseline gap-3">
                    <span className="text-compact-xs font-mono text-neutral-500 w-24 shrink-0">
                      {step} · {v.fontSize}/{v.lineHeight}
                    </span>
                    <span
                      style={{ fontSize: v.fontSize, lineHeight: `${v.lineHeight}px` }}
                      className="text-neutral-900"
                    >
                      CARGO · посылка CARGO-A1B2C3D4
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Spacing (база 4)">
        <div className="flex flex-wrap items-end gap-4">
          {Object.entries(space).map(([step, n]) => (
            <div key={step} className="flex flex-col items-center gap-1">
              <div className="bg-accent-400" style={{ width: n, height: n }} />
              <span className="text-compact-xs font-mono text-neutral-500">
                {step}·{n}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Radii">
        <div className="flex flex-wrap gap-6">
          {Object.entries(radius).map(([name, n]) => (
            <div key={name} className="flex flex-col items-center gap-1">
              <div
                className="h-16 w-16 bg-neutral-200 border border-neutral-300"
                style={{ borderRadius: n }}
              />
              <span className="text-compact-xs font-mono text-neutral-500">
                {name}·{n}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Shadows">
        <div className="flex flex-wrap gap-8">
          {Object.entries(shadow).map(([name, s]) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div
                className="h-20 w-32 bg-white"
                style={{
                  borderRadius: radius.lg,
                  boxShadow: `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px rgba(26,23,18,${s.opacity})`,
                }}
              />
              <span className="text-compact-xs font-mono text-neutral-500">{name}</span>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
