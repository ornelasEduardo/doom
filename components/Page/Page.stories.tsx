import type { Meta, StoryObj } from '@storybook/react';
import {  Page  } from 'doom-design-system';
import {  Text  } from 'doom-design-system';

const meta: Meta<typeof Page> = {
  title: 'Design System/Page',
  component: Page,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'fullWidth'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Page>;

export const Default: Story = {
  render: (args) => (
    <Page {...args}>
      <div style={{ background: '#f3f4f6', padding: '2rem', border: '1px dashed #ccc' }}>
        <Text variant="h1">Page Title</Text>
        <Text>
          This is the default page layout. It has a constrained width and standard padding.
          Resize the window to see how it behaves.
        </Text>
      </div>
    </Page>
  ),
};

export const FullWidth: Story = {
  render: (args) => (
    <Page {...args}>
      <div style={{ background: '#e0e7ff', padding: '2rem', border: '1px dashed #ccc', height: '100vh' }}>
        <Text variant="h1">Full Width Page</Text>
        <Text>
          This is the full-width page layout. It spans the entire viewport width.
        </Text>
      </div>
    </Page>
  ),
  args: {
    variant: 'fullWidth',
  },
};
