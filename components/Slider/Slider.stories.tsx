import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from './Slider';

const meta: Meta<typeof Slider> = {
  title: 'Design System/Slider',
  component: Slider,
  tags: ['autodocs'],
  argTypes: {
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: {
    label: 'Volume',
    showValue: true,
    defaultValue: 50,
  },
};

export const Controlled: Story = {
  render: () => {
    const [val, setVal] = useState(25);
    return (
      <Slider 
        label="Controlled Value" 
        value={val} 
        onChange={setVal} 
        showValue 
      />
    );
  }
};

export const Steps: Story = {
  args: {
    label: 'Stepped (10)',
    step: 10,
    defaultValue: 0,
    showValue: true,
  },
};
