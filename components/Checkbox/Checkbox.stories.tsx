import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './Checkbox';
import { useState } from 'react';

const meta: Meta<typeof Checkbox> = {
  title: 'Design System/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: {
    label: 'Accept terms and conditions',
  },
};

export const Checked: Story = {
  args: {
    label: 'Subscribed to newsletter',
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Cannot uncheck this',
    disabled: true,
    defaultChecked: true,
  },
};

export const Uncontrolled: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-4">
        <Checkbox label="Option 1" />
        <Checkbox label="Option 2" defaultChecked />
        <Checkbox label="Option 3" disabled />
      </div>
    );
  },
};

export const Controlled: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <div className="flex flex-col gap-4">
        <Checkbox 
          label={`Value is: ${checked}`} 
          checked={checked} 
          onChange={(e) => setChecked(e.target.checked)} 
        />
        <button 
          className="text-xs bg-primary text-primary-foreground px-2 py-1" 
          onClick={() => setChecked(!checked)}
        >
          Toggle from outside
        </button>
      </div>
    );
  },
};
