import type { Meta, StoryObj } from '@storybook/react';
import {  Dropdown  } from '../..';

const meta: Meta<typeof Dropdown> = {
  title: 'Design System/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

export const Default: Story = {
  args: {
    triggerLabel: 'Options',
    items: [
      { label: 'Edit', onClick: () => alert('Edit clicked') },
      { label: 'Duplicate', onClick: () => alert('Duplicate clicked') },
      { label: 'Delete', onClick: () => alert('Delete clicked') },
    ],
  },
};

export const Secondary: Story = {
  args: {
    triggerLabel: 'Actions',
    variant: 'secondary',
    items: [
      { label: 'Profile', onClick: () => alert('Profile clicked') },
      { label: 'Settings', onClick: () => alert('Settings clicked') },
      { label: 'Logout', onClick: () => alert('Logout clicked') },
    ],
  },
};
