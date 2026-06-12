import type { Meta, StoryObj } from '@storybook/react-vite';
import { Timeline } from './Timeline.tsx';
import { DensityPair } from './_storybook/DensityPair.tsx';

const meta = {
  title: 'Components/Timeline',
  component: Timeline,
} satisfies Meta<typeof Timeline>;
export default meta;
type Story = StoryObj;

// status-axis history only — claim_status never appears here (TZ §3). The
// component's type makes that impossible: steps are StatusValue.
export const ParcelHistory: Story = {
  render: () => (
    <Timeline
      steps={[
        { status: 'AT_JP', at: '01.06 09:12', state: 'done' },
        { status: 'PACKED', at: '02.06 14:40', state: 'done' },
        { status: 'SHIPPED', at: '03.06 08:00', state: 'done' },
        { status: 'AT_KG', at: '09.06 11:25', state: 'done' },
        { status: 'DELIVERY', at: '10.06 10:05', state: 'current' },
        { status: 'DONE', state: 'upcoming' },
      ]}
    />
  ),
};

export const Densities: Story = {
  render: () => (
    <DensityPair>
      <Timeline
        steps={[
          { status: 'SHIPPED', at: '03.06', state: 'done' },
          { status: 'AT_KG', at: '09.06', state: 'current' },
          { status: 'DELIVERY', state: 'upcoming' },
        ]}
      />
    </DensityPair>
  ),
};
