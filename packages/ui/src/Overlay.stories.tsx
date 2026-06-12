import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Modal, Sheet } from './Sheet.tsx';
import { Button } from './Button.tsx';
import { Input } from './Input.tsx';
import { Timeline } from './Timeline.tsx';

const meta: Meta = {
  title: 'Components/Overlay',
};
export default meta;
type Story = StoryObj;

export const ModalConfirm: Story = {
  render: function ModalDemo() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Открыть модалку</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Подтвердите выдачу"
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button variant="primary" onClick={() => setOpen(false)}>
                Подтвердить
              </Button>
            </>
          }
        >
          <Input label="Код OTP" mono placeholder="000000" />
        </Modal>
      </>
    );
  },
};

export const SideSheet: Story = {
  render: function SheetDemo() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Открыть детали
        </Button>
        <Sheet open={open} onClose={() => setOpen(false)} title="CARGO-A1B2C3D4">
          <Timeline
            steps={[
              { status: 'SHIPPED', at: '03.06', state: 'done' },
              { status: 'AT_KG', at: '09.06', state: 'current' },
              { status: 'DELIVERY', state: 'upcoming' },
            ]}
          />
        </Sheet>
      </>
    );
  },
};
