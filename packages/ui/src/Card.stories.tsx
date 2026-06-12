import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card.tsx';
import { Button } from './Button.tsx';
import { StatusBadge } from './StatusBadge.tsx';
import { ClaimBadge } from './ClaimBadge.tsx';
import { DensityPair } from './_storybook/DensityPair.tsx';

const meta = {
  title: 'Components/Card',
  component: Card,
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj;

export const Composed: Story = {
  render: () => (
    <Card style={{ maxWidth: 360 }}>
      <Card.Header>CARGO-A1B2C3D4</Card.Header>
      <Card.Body>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
          <StatusBadge status="DELIVERY" />
          <ClaimBadge claim="CLAIMED" />
        </div>
        <div style={{ color: 'var(--cui-text-secondary)' }}>Трек JP990041 · ПВЗ «Центр»</div>
      </Card.Body>
      <Card.Footer>
        <Button variant="primary" fullWidth>
          Выдать
        </Button>
      </Card.Footer>
    </Card>
  ),
};

export const Densities: Story = {
  render: () => (
    <DensityPair>
      <Card interactive style={{ maxWidth: 320 }}>
        <Card.Body>Кликабельная карточка посылки</Card.Body>
      </Card>
    </DensityPair>
  ),
};
