import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table, type Column } from './Table.tsx';
import { StatusBadge } from './StatusBadge.tsx';
import { ClaimBadge } from './ClaimBadge.tsx';
import { EmptyState } from './EmptyState.tsx';
import type { StatusValue, ClaimValue } from './labels.ts';
import { DensityPair } from './_storybook/DensityPair.tsx';

interface Parcel {
  code: string;
  track: string;
  status: StatusValue;
  claim: ClaimValue;
}

// Sample rows; DELIVERY and LOST are placed on adjacent rows on purpose so the
// two warm reds can be eyeballed in a real table row context (not just side by
// side as chips).
const ROWS: Parcel[] = [
  { code: 'CARGO-A1B2C3D4', track: 'JP991002', status: 'AT_JP', claim: 'CLAIMED' },
  { code: 'CARGO-9F8E7D6C', track: 'JP991188', status: 'SHIPPED', claim: 'UNCLAIMED' },
  { code: 'CARGO-77AA22BB', track: 'JP990041', status: 'DELIVERY', claim: 'CLAIMED' },
  { code: 'CARGO-12CD34EF', track: 'JP992277', status: 'LOST', claim: 'DISPUTED' },
  { code: 'CARGO-55GG66HH', track: 'JP993301', status: 'DONE', claim: 'CLAIMED' },
];

const columns: Array<Column<Parcel>> = [
  { key: 'code', header: 'Код посылки', render: (r) => r.code, mono: true },
  { key: 'track', header: 'Трек', render: (r) => r.track, mono: true },
  { key: 'status', header: 'status', render: (r) => <StatusBadge status={r.status} /> },
  { key: 'claim', header: 'claim_status', render: (r) => <ClaimBadge claim={r.claim} /> },
];

const meta = {
  title: 'Components/Table',
  component: Table,
} satisfies Meta<typeof Table>;
export default meta;
type Story = StoryObj;

// Both axes live in their own columns (TZ §3 — never merged). Rows 3 & 4 are
// DELIVERY then LOST.
export const ParcelsBothAxes: Story = {
  render: () => (
    <Table columns={columns} rows={ROWS} getRowKey={(r) => r.code} />
  ),
};

export const Densities: Story = {
  render: () => (
    <DensityPair>
      <Table columns={columns} rows={ROWS} getRowKey={(r) => r.code} />
    </DensityPair>
  ),
};

export const Empty: Story = {
  render: () => (
    <Table
      columns={columns}
      rows={[]}
      getRowKey={(r) => r.code}
      empty={<EmptyState icon="📭" title="Посылок нет" description="Ничего не найдено по фильтру." />}
    />
  ),
};
