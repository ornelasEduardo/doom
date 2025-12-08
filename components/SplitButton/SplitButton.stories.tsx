import type { Meta, StoryObj } from '@storybook/react';
import {  SplitButton  } from '../..';

const meta: Meta<typeof SplitButton> = {
  title: 'Design System/SplitButton',
  component: SplitButton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof SplitButton>;

export const Default: Story = {
  args: {
    primaryLabel: 'Save',
    onPrimaryClick: () => alert('Save clicked'),
    items: [
      { label: 'Save as Draft', onClick: () => alert('Save as Draft clicked') },
      { label: 'Save and Publish', onClick: () => alert('Save and Publish clicked') },
    ],
  },
};

export const Secondary: Story = {
  args: {
    primaryLabel: 'Export',
    variant: 'secondary',
    onPrimaryClick: () => alert('Export clicked'),
    items: [
      { label: 'Export as PDF', onClick: () => alert('Export as PDF clicked') },
      { label: 'Export as CSV', onClick: () => alert('Export as CSV clicked') },
    ],
  },
};
