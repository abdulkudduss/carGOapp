import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button.tsx';
import { DensityPair } from './_storybook/DensityPair.tsx';

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Принять посылку' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { variant: 'primary' } };
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Danger: Story = { args: { variant: 'danger', children: 'Утилизировать' } };
export const Disabled: Story = { args: { disabled: true } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
};

// Density is the spine: same component, compact (web-ops) vs comfortable (pvz,
// ≥44px). Nothing about density is a prop.
export const Densities: Story = {
  render: () => (
    <DensityPair>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Button variant="primary">Принять посылку</Button>
        <Button variant="secondary">Отмена</Button>
      </div>
    </DensityPair>
  ),
};
