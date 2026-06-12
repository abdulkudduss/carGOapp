import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toast, ToastProvider, useToast } from './Toast.tsx';
import { Button } from './Button.tsx';

const meta: Meta = {
  title: 'Components/Toast',
};
export default meta;
type Story = StoryObj;

// Static presentation of all four variants.
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxWidth: 360 }}>
      <Toast variant="success" title="Посылка принята" description="CARGO-A1B2C3D4" />
      <Toast variant="info" title="Синхронизация" description="Очередь офлайн отправлена" />
      <Toast variant="warning" title="Слабая сеть" description="Повтор через 5 с" />
      <Toast variant="danger" title="Не удалось" description="ALREADY_CLAIMED" />
    </div>
  ),
};

function PusherInner() {
  const { toast } = useToast();
  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
      <Button variant="primary" onClick={() => toast({ variant: 'success', title: 'Готово', description: 'Сохранено' })}>
        success
      </Button>
      <Button variant="secondary" onClick={() => toast({ variant: 'info', title: 'Инфо' })}>
        info
      </Button>
      <Button variant="danger" onClick={() => toast({ variant: 'danger', title: 'Ошибка', description: 'Повторите' })}>
        danger
      </Button>
    </div>
  );
}

// Live queue via the provider + useToast hook (auto-dismiss after 4s).
export const ProviderQueue: Story = {
  render: () => (
    <ToastProvider>
      <PusherInner />
    </ToastProvider>
  ),
};
