import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from './Tooltip';

const UnderlinedText = ({ children }: { children: React.ReactNode }) => (
  <span style={{
    textDecoration: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationThickness: '2px',
    textUnderlineOffset: '4px',
    cursor: 'help',
    fontWeight: 600
  }} className="hover:text-primary hover:decoration-solid">
    {children}
  </span>
);

const meta: Meta<typeof Tooltip> = {
  title: 'Design System/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  argTypes: {
    content: { control: 'text' },
    delay: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <UnderlinedText>Hover over this term</UnderlinedText>
    </Tooltip>
  ),
  args: {
    content: 'Explanation of the term',
  },
};

export const Delayed: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <UnderlinedText>Long Delay Interaction</UnderlinedText>
    </Tooltip>
  ),
  args: {
    content: 'Thank you for waiting!',
    delay: 1000,
  },
};

export const Edges: Story = {
  render: () => (
    <div style={{ height: '300px', width: '100%', position: 'relative', border: '1px dashed #ccc' }}>
      <div style={{ position: 'absolute', top: 0, left: 0 }}>
        <Tooltip content="Top Left Flip -> Bottom">
          <UnderlinedText>Top Left</UnderlinedText>
        </Tooltip>
      </div>
      <div style={{ position: 'absolute', top: 0, right: 0 }}>
        <Tooltip content="Top Right Flip -> Bottom">
          <UnderlinedText>Top Right</UnderlinedText>
        </Tooltip>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0 }}>
        <Tooltip content="Bottom Left -> Top" placement="bottom">
          <UnderlinedText>Bottom Left</UnderlinedText>
        </Tooltip>
      </div>
      <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
        <Tooltip content="Bottom Right -> Top" placement="bottom">
          <UnderlinedText>Bottom Right</UnderlinedText>
        </Tooltip>
      </div>
    </div>
  ),
};
