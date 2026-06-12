import type { Decorator, Preview } from '@storybook/react-vite';
// Token CSS vars (raw scales, badges, type, spacing…) then the @cargo/ui layer
// (role + density seams + component classes). Order matters: vars first.
import '@cargo/tokens/variables.css';
import '../src/styles.css';

// Toolbar toggle so every story can be previewed in either density. Stories that
// must show BOTH at once render their own side-by-side data-density blocks.
export const globalTypes = {
  density: {
    description: 'Component density (web-ops = compact, pvz = comfortable)',
    defaultValue: 'comfortable',
    toolbar: {
      title: 'Density',
      icon: 'component',
      items: [
        { value: 'compact', title: 'compact · web-ops' },
        { value: 'comfortable', title: 'comfortable · pvz' },
      ],
      dynamicTitle: true,
    },
  },
};

const withDensity: Decorator = (Story, ctx) => (
  <div
    data-density={ctx.globals.density as string}
    className="cui"
    style={{
      background: 'var(--cui-bg-app)',
      color: 'var(--cui-text-primary)',
      padding: 'var(--space-6)',
      minHeight: '100vh',
    }}
  >
    <Story />
  </div>
);

const preview: Preview = {
  decorators: [withDensity],
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
  },
};

export default preview;
