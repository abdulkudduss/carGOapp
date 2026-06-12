import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusBadge } from './StatusBadge.tsx';
import { ClaimBadge } from './ClaimBadge.tsx';
import { STATUS_ORDER, CLAIM_ORDER } from './labels.ts';
import { DensityPair } from './_storybook/DensityPair.tsx';

const meta: Meta = {
  title: 'Components/Badges',
};
export default meta;
type Story = StoryObj;

const column = { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'flex-start' } as const;

// Acceptance criterion: all 10 status + all 3 claim values render correctly.
export const StatusAxis_All10: Story = {
  name: 'status axis — all 10',
  render: () => (
    <div style={column}>
      {STATUS_ORDER.map((s) => (
        <StatusBadge key={s} status={s} />
      ))}
    </div>
  ),
};

export const ClaimAxis_All3: Story = {
  name: 'claim_status axis — all 3',
  render: () => (
    <div style={column}>
      {CLAIM_ORDER.map((c) => (
        <ClaimBadge key={c} claim={c} />
      ))}
    </div>
  ),
};

// The 13 together, both densities — the "Badge renders all 13" gate.
export const All13_BothDensities: Story = {
  name: 'all 13 · both densities',
  render: () => (
    <DensityPair>
      <div style={column}>
        {STATUS_ORDER.map((s) => (
          <StatusBadge key={s} status={s} />
        ))}
        <div style={{ height: 8 }} />
        {CLAIM_ORDER.map((c) => (
          <ClaimBadge key={c} claim={c} />
        ))}
      </div>
    </DensityPair>
  ),
};

// Visual differentiation check: DELIVERY (#FBDCD2/#B0371F, warm) vs LOST
// (#FBE0E8/#A8173F, carmine) sit next to each other here on purpose.
export const DeliveryVsLost: Story = {
  name: 'DELIVERY vs LOST (adjacency check)',
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
      <StatusBadge status="DELIVERY" />
      <StatusBadge status="LOST" />
    </div>
  ),
};
