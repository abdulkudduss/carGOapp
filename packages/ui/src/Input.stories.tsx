import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input, ScannerField } from './Input.tsx';
import { Button } from './Button.tsx';
import { DensityPair } from './_storybook/DensityPair.tsx';

const meta = {
  title: 'Components/Input',
  component: Input,
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Трек-номер', placeholder: 'JP...' },
};

export const WithHint: Story = {
  args: { label: 'Код посылки', hint: 'Формат CARGO-XXXXXXXX', mono: true, placeholder: 'CARGO-' },
};

export const Invalid: Story = {
  args: { label: 'Трек-номер', error: 'Такой трек не найден', defaultValue: 'JP000000' },
};

export const Disabled: Story = {
  args: { label: 'Room', value: '336-1045', disabled: true, mono: true },
};

export const Densities: Story = {
  render: () => (
    <DensityPair>
      <Input label="Поиск" placeholder="Код, трек или телефон" />
    </DensityPair>
  ),
};

// Scanner field: type a code and press Enter to simulate a hardware scan; the
// last scan is shown, the field clears and re-focuses (the warehouse loop).
export const Scanner: Story = {
  render: function ScannerDemo() {
    const [last, setLast] = useState<string>('—');
    const [value, setValue] = useState('');
    const ref = useRef<HTMLInputElement>(null);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxWidth: 360 }}>
        <ScannerField
          ref={ref}
          label="Скан посылки"
          placeholder="Отсканируйте QR (Enter)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onScan={(code) => {
            setLast(code);
            setValue('');
            ref.current?.focus();
          }}
        />
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--cui-text-secondary)' }}>
          Последний скан: {last}
        </div>
        <Button variant="secondary" onClick={() => ref.current?.focus()}>
          Вернуть фокус в поле
        </Button>
      </div>
    );
  },
};
