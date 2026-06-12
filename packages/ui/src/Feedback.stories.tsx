import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './Skeleton.tsx';
import { EmptyState } from './EmptyState.tsx';
import { Card } from './Card.tsx';
import { Button } from './Button.tsx';

const meta: Meta = {
  title: 'Components/Feedback',
};
export default meta;
type Story = StoryObj;

export const SkeletonCard: Story = {
  name: 'Skeleton — loading card',
  render: () => (
    <Card style={{ maxWidth: 360 }}>
      <Card.Body>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <Skeleton width={140} height={14} />
          <Skeleton width="100%" height={12} />
          <Skeleton width="70%" height={12} />
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <Skeleton width={88} height={22} rounded />
            <Skeleton width={120} height={22} rounded />
          </div>
        </div>
      </Card.Body>
    </Card>
  ),
};

export const EmptyList: Story = {
  render: () => <EmptyState icon="📦" title="Здесь пока пусто" description="Привязанных посылок нет." />,
};

export const NetworkError: Story = {
  render: () => (
    <EmptyState
      icon="⚠️"
      title="Нет соединения"
      description="Не удалось загрузить данные."
      action={<Button variant="secondary">Повторить</Button>}
    />
  ),
};
