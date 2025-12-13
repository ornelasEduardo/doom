import type { Meta, StoryObj } from '@storybook/react';
import {  ProgressBar  } from 'doom-design-system';

const meta: Meta<typeof ProgressBar> = {
  title: 'Design System/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100 } },
    color: { control: 'color' },
    showStripes: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = {
  args: {
    value: 50,
  },
};

export const CustomColor: Story = {
  args: {
    value: 75,
    color: '#ef4444',
  },
};

export const NoStripes: Story = {
  args: {
    value: 60,
    showStripes: false,
  },
};
