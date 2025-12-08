import type { Meta, StoryObj } from '@storybook/react';
import { Popover } from './Popover';
import { Button, Card, Text } from '../..';
import { useState } from 'react';

const meta: Meta<typeof Popover> = {
  title: 'Design System/Popover',
  component: Popover,
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: 'select',
      options: ['bottom-start', 'bottom-end', 'bottom-center'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Popover>;

const PopoverDemo = (props: Partial<React.ComponentProps<typeof Popover>>) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover
      {...props}
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      trigger={
        <Button onClick={() => setIsOpen(!isOpen)}>
          {props.trigger || 'Click me'}
        </Button>
      }
      content={
        props.content || (
          <Card style={{ padding: '1rem', width: '200px' }}>
            <Text weight="bold">Popover Content</Text>
            <Text variant="small">This is some content inside the popover.</Text>
          </Card>
        )
      }
    />
  );
};

export const Default: Story = {
  render: () => (
    <div style={{ padding: '100px', display: 'flex', justifyContent: 'center' }}>
      <PopoverDemo />
    </div>
  ),
};

export const Placements: Story = {
  render: () => (
    <div style={{ padding: '100px', display: 'flex', gap: '2rem', justifyContent: 'center' }}>
      <PopoverDemo placement="bottom-start" trigger="Bottom Start" />
      <PopoverDemo placement="bottom-center" trigger="Bottom Center" />
      <PopoverDemo placement="bottom-end" trigger="Bottom End" />
    </div>
  ),
};

export const EdgeDetection: Story = {
  render: () => (
    <div style={{ height: '200vh', width: '200vw', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
        <PopoverDemo trigger="Top Left (Flips Down)" />
      </div>
      <div style={{ position: 'absolute', bottom: '10px', left: '10px' }}>
        <PopoverDemo trigger="Bottom Left (Flips Up)" />
      </div>
      <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
        <PopoverDemo trigger="Top Right (Flips Down)" />
      </div>
      <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
        <PopoverDemo trigger="Bottom Right (Flips Up)" />
      </div>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        <PopoverDemo trigger="Center" />
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  }
};
